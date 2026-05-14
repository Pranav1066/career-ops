#!/usr/bin/env node

/**
 * apify-scan.mjs — Apify-powered scraper for LinkedIn, Naukri, and Indeed India
 *
 * Runs Apify actors defined in portals.yml `apify_searches` section.
 * Rotates through multiple API tokens automatically when one's quota is exhausted.
 * Applies the same title/location filters as scan.mjs.
 *
 * Usage:
 *   node apify-scan.mjs              # run all enabled apify_searches
 *   node apify-scan.mjs --dry-run    # preview without writing files
 *   node apify-scan.mjs --search "LinkedIn — AI/ML"  # run a single search by name
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import yaml from 'js-yaml';

mkdirSync('data', { recursive: true });

// ── Load .env ────────────────────────────────────────────────────────

function loadEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

// ── Config ────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const SINGLE = (() => {
  const idx = process.argv.indexOf('--search');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

const PORTALS_PATH   = 'portals.yml';
const HISTORY_PATH   = 'data/scan-history.tsv';
const PIPELINE_PATH  = 'data/pipeline.md';
const APPS_PATH      = 'data/applications.md';
const TODAY          = new Date().toISOString().slice(0, 10);
const POLL_INTERVAL  = 6_000;
const POLL_TIMEOUT   = 300_000;
const FETCH_TIMEOUT  = 20_000;

const cfg = yaml.load(readFileSync(PORTALS_PATH, 'utf8'));
const allSearches = (cfg.apify_searches || []).filter(s => s.enabled !== false);
const searches = SINGLE
  ? allSearches.filter(s => s.name.toLowerCase().includes(SINGLE.toLowerCase()))
  : allSearches;

const tokens = (process.env.APIFY_API_TOKENS || '')
  .split(',').map(t => t.trim()).filter(Boolean);

if (!tokens.length) {
  console.error('Error: APIFY_API_TOKENS not set in .env');
  process.exit(1);
}

if (!searches.length) {
  console.error('No enabled apify_searches found in portals.yml');
  process.exit(1);
}

// ── Filters ───────────────────────────────────────────────────────────

function buildTitleFilter(tf) {
  const pos = (tf?.positive || []).map(k => k.toLowerCase());
  const neg = (tf?.negative || []).map(k => k.toLowerCase());
  return (title) => {
    const t = (title || '').toLowerCase();
    const ok = pos.length === 0 || pos.some(k => t.includes(k));
    const bad = neg.some(k => t.includes(k));
    return ok && !bad;
  };
}

function buildLocationFilter(lf) {
  if (!lf) return () => true;
  const pos = (lf.positive || []).map(k => k.toLowerCase());
  const neg = (lf.negative || []).map(k => k.toLowerCase());
  return (loc) => {
    if (!loc) return pos.length === 0;
    const l = loc.toLowerCase();
    const ok = pos.length === 0 || pos.some(k => l.includes(k));
    const bad = neg.some(k => l.includes(k));
    return ok && !bad;
  };
}

const titleOk = buildTitleFilter(cfg.title_filter);
const locationOk = buildLocationFilter(cfg.location_filter);

// ── Dedup ─────────────────────────────────────────────────────────────

function loadSeen() {
  const seen = new Set();
  for (const path of [HISTORY_PATH, PIPELINE_PATH, APPS_PATH]) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/https?:\/\/[^\s|]+/);
      if (m) seen.add(m[0].replace(/[|,\s]+$/, ''));
    }
  }
  return seen;
}

// ── Apify helpers ─────────────────────────────────────────────────────

let tokenIdx = 0;

function tok() { return tokens[tokenIdx % tokens.length]; }

function rotateToken(reason) {
  console.warn(`  ⚠ Token rotated (${reason})`);
  tokenIdx++;
  if (tokenIdx >= tokens.length) throw new Error('All Apify tokens exhausted');
}

async function apiFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function startRun(actorId, input) {
  for (let i = 0; i < tokens.length; i++) {
    const res = await apiFetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${tok()}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
    );
    if (res.status === 402) { rotateToken('quota'); continue; }
    if (res.status === 429) { rotateToken('rate-limit'); continue; }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Start failed ${res.status}: ${body.slice(0, 300)}`);
    }
    const { data } = await res.json();
    return { runId: data.id, token: tok() };
  }
  throw new Error('All tokens failed');
}

async function waitForRun(runId, token) {
  const deadline = Date.now() + POLL_TIMEOUT;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    const res = await apiFetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const { data } = await res.json();
    if (data.status === 'SUCCEEDED') return;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(data.status))
      throw new Error(`Run ${data.status}`);
  }
  throw new Error('Timed out waiting for actor run');
}

async function getItems(runId, token) {
  const res = await apiFetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}&clean=true`
  );
  if (!res.ok) throw new Error(`Dataset fetch failed: ${res.status}`);
  return res.json();
}

// ── Normalize job items across different actors ───────────────────────

function normalize(item, actorId) {
  const a = actorId.toLowerCase();

  if (a.includes('linkedin')) {
    // curious_coder/linkedin-jobs-scraper uses `link` as the job URL field
    return {
      title:    item.title        || item.jobTitle        || '',
      company:  item.companyName  || item.company         || '',
      url:      item.link         || item.applyUrl        || item.jobUrl || item.url || '',
      location: item.location     || item.formattedLocation || '',
    };
  }

  if (a.includes('naukri')) {
    // muhammetakkurtt/naukri-job-scraper uses `jdURL` as the job URL field
    return {
      title:    item.title        || item.jobTitle        || '',
      company:  item.companyName  || item.company         || '',
      url:      item.jdURL        || item.url             || item.jobUrl || '',
      location: item.location     || item.city            || '',
    };
  }

  if (a.includes('indeed')) {
    // misceres/indeed-scraper uses `positionName` for title and `url` for link
    return {
      title:    item.positionName || item.title           || '',
      company:  item.company      || item.companyName     || '',
      url:      item.url          || item.externalApplyLink || item.jobUrl || '',
      location: item.location     || item.formattedLocation || item.jobLocation || '',
    };
  }

  // Generic fallback
  return {
    title:    item.title || item.jobTitle || item.positionName || '',
    company:  item.company || item.companyName || '',
    url:      item.url || item.jdURL || item.link || item.jobUrl || item.applyUrl || '',
    location: item.location || '',
  };
}

// ── Main ──────────────────────────────────────────────────────────────

const seen = loadSeen();
const added = [];
const skippedTitle = [];
const skippedLoc = [];
const skippedDup = [];
const errors = [];

console.log(`\nApify Scan — ${TODAY}${DRY_RUN ? ' [DRY RUN]' : ''}`);
console.log(`Searches: ${searches.length} | Tokens: ${tokens.length}\n`);

for (const search of searches) {
  process.stdout.write(`→ ${search.name} ... `);
  let items = [];
  try {
    const { runId, token } = await startRun(search.actor, search.input);
    process.stdout.write('running');
    await waitForRun(runId, token);
    items = await getItems(runId, token);
    process.stdout.write(` → ${items.length} results\n`);
  } catch (err) {
    process.stdout.write(`ERROR: ${err.message}\n`);
    errors.push({ name: search.name, error: err.message });
    continue;
  }

  for (const raw of items) {
    const job = normalize(raw, search.actor);
    if (!job.url || !job.title) continue;

    // Normalise URL (strip trailing junk)
    job.url = job.url.replace(/[|,\s]+$/, '');

    if (seen.has(job.url)) { skippedDup.push(job); continue; }
    seen.add(job.url);

    if (!titleOk(job.title)) { skippedTitle.push({ ...job, source: search.name }); continue; }

    if (job.location && !locationOk(job.location)) {
      skippedLoc.push({ ...job, source: search.name });
      continue;
    }

    added.push({ ...job, source: search.name });
  }
}

// ── Persist ───────────────────────────────────────────────────────────

if (!DRY_RUN && added.length) {
  const pipe = added.map(j => `- [ ] ${j.url} | ${j.company} | ${j.title}`).join('\n');
  appendFileSync(PIPELINE_PATH, '\n' + pipe + '\n');

  const hist = [
    ...added.map(j => `${j.url}\t${TODAY}\t${j.source}\t${j.title}\t${j.company}\tadded`),
    ...skippedTitle.map(j => `${j.url}\t${TODAY}\t${j.source}\t${j.title}\t${j.company}\tskipped_title`),
    ...skippedLoc.map(j => `${j.url}\t${TODAY}\t${j.source}\t${j.title}\t${j.company}\tskipped_location`),
    ...skippedDup.map(j => `${j.url}\t${TODAY}\tapify\t${j.title}\t${j.company}\tskipped_dup`),
  ].join('\n');
  if (hist) appendFileSync(HISTORY_PATH, '\n' + hist);
}

// ── Summary ───────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Apify Scan — ${TODAY}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Searches run:          ${searches.length}`);
console.log(`Filtered by title:     ${skippedTitle.length} removed`);
console.log(`Filtered by location:  ${skippedLoc.length} removed`);
console.log(`Duplicates:            ${skippedDup.length} skipped`);
console.log(`New offers added:      ${added.length}${DRY_RUN ? ' (dry run — not written)' : ''}`);

if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e.name}: ${e.error}`);
}

if (added.length) {
  console.log('\nNew offers:');
  for (const j of added) console.log(`  + ${j.company} | ${j.title} | ${j.source}`);
}

if (!added.length && !errors.length) {
  console.log('\nNo new offers found (all duplicates or filtered).');
}

console.log('\n→ Run /career-ops pipeline to evaluate new offers.');
