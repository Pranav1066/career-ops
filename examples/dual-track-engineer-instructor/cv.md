# PRANAV RAM DS

**Coimbatore, India** · pranavram106@gmail.com · 7867997369 · [linkedin.com/in/pranav-ram344](https://linkedin.com/in/pranav-ram344) · [github.com/Pranav1066](https://github.com/Pranav1066)

---

## Professional Summary

AI Engineer with hands-on production experience building multi-agent systems, RAG pipelines, and LLM-powered platforms in edtech. Earned Performer of the Month within 30 days at iamneo, delivering 120% of target KPIs and reducing support tickets to zero. Comfortable shipping end-to-end: agent orchestration, hybrid retrieval systems, LLM fine-tuning, full-stack integrations, and multimodal UX. Looking for a role where the stack is modern and the problems are hard.

---

## Recent Engineering Highlights

- Built and deployed production-grade multi-agent systems using LangGraph, CrewAI, and Agno serving 300+ associates — 98% first-time adoption, zero user-reported issues, 100% on-time delivery throughout the internship.
- Engineered a Hybrid RAG system combining FAISS semantic search, BM25 keyword search, and cross-encoder reranking — full modular pipeline from PDF ingestion to grounded Gemini answers.
- Fine-tuned Mistral-7B on GSM8K using QLoRA (4-bit quantization, LoRA rank 16) with HuggingFace Transformers and PEFT, building the full train/evaluate/generate pipeline from scratch.
- Advanced prompt engineering work improved model relevance by 40% and cut revision cycles by 60% across 5+ platforms at iamneo.

---

## Work Experience

### iamneo — Coimbatore
**AI Engineer (Intern)**
*September 2025 – March 2026*

- Earned Performer of the Month within the first 30 days, outperforming 50+ team members and delivering 120% of target KPIs.
- Developed and deployed production-grade AI solutions using LangGraph, CrewAI, and Agno, serving 300+ associates with 100% on-time delivery, 98% first-time adoption, and zero user-reported issues — reducing support tickets by 100%.
- Delivered a technical lightning talk on LLM Poisoning to 80+ attendees at the Global AI Community, achieving 95% positive feedback.
- Integrated advanced prompt engineering to improve model relevance by 40% and reduce revision cycles by 60% across 5+ platforms.

---

## Projects

### Hybrid RAG — [github.com/Pranav1066/HYBRID_RAG](https://github.com/Pranav1066/HYBRID_RAG)

- Built a fully modular RAG pipeline combining FAISS vector search and BM25 keyword search for hybrid retrieval, with cross-encoder reranking (`ms-marco-MiniLM-L-6-v2`) on top.
- Used Gemini embeddings for semantic indexing and Gemini as the answer generator, constrained strictly to retrieved PDF context to minimize hallucination.
- Exposed the pipeline through both a Streamlit chat UI and a FastAPI backend with `/upload` and `/ask` endpoints.
- Stack: Python, Streamlit, FastAPI, Gemini API, FAISS, BM25 (rank-bm25), Sentence Transformers, PyPDF.

### LLM Fine-Tuning — [github.com/Pranav1066/LLM-Fine-Tuning](https://github.com/Pranav1066/LLM-Fine-Tuning)

- Fine-tuned Mistral-7B-Instruct on the GSM8K math reasoning dataset using QLoRA — 4-bit NF4 quantization via BitsAndBytes, LoRA rank 16 targeting all attention and MLP projection layers.
- Built the complete training pipeline: dataset formatting, tokenization, PEFT model preparation, HuggingFace `Trainer` integration, and checkpoint saving.
- Included a `generate.py` for inference and `test.py` for evaluation, making the repo end-to-end runnable.
- Stack: Python, HuggingFace Transformers, PEFT, BitsAndBytes, PyTorch, datasets.

### iamneo — RAG (Chat with Local Documents)
*January 2026*

- Engineered a conversational AI system supporting PDFs, scanned documents, Word, and spreadsheets with 95%+ extraction accuracy.
- Implemented RAG architecture with open-source (Mistral, LLaMA) and proprietary (GPT-4, Claude) LLMs for context-aware document querying.
- Designed vector database infrastructure using Pinecone/ChromaDB, reducing retrieval latency by 60% and improving response relevance by 40%.
- Integrated OCR preprocessing for scanned PDFs, enabling text extraction from 10,000+ legacy documents with 90%+ character recognition accuracy.

### iamneo Code Craft — [github.com/Pranav1066/VirtusaAgenticAIHackathon_IAM-23](https://github.com/Pranav1066/VirtusaAgenticAIHackathon_IAM-23)
*October – November 2025*

- Constructed a modular multi-agent system using LangGraph and Google Gemini to convert user stories into 5–8 deployable microservices per request, reducing backend scaffolding time by ~70%.
- Implemented fully automated code, OpenAPI (Swagger), and unit test generation — 100% API coverage and 10+ test cases per service through centralized state orchestration.
- Enabled 8 backend languages and 3 architecture styles (REST, gRPC, event-driven); Streamlit UI generated complete project structures in under 2 minutes.

### Legal AI Platform (LAW) — [github.com/Pranav1066/Law](https://github.com/Pranav1066/Law)
*May – July 2025*

- Built a full-stack Legal AI platform with FastAPI and React (Vite + TypeScript), using LangChain-based multi-agent orchestration to route 100+ legal queries/day with <1.5s average response time.
- Implemented high-performance RAG with Pinecone and Azure OpenAI across 1,000+ pages of Indian criminal law PDFs, improving legal answer relevance by ~60% over keyword search.
- Built multimodal UX with real-time speech-to-text and custom TTS supporting 3+ Indian languages (Tamil, Hindi, English).

---

## Education

**Sri Krishna College of Engineering and Technology** — B.E. Computer Science and Engineering

**Certifications:** Python for Data Science — NPTEL Elite (Aug 2024)

---

## Skills

**Engineering:** Python (daily), Flask, FastAPI, React, TypeScript, Streamlit, AWS

**AI / ML Stack:** LangChain, LangGraph, CrewAI, Agno, Anthropic SDK, HuggingFace Transformers, PEFT, BitsAndBytes, LLMs (GPT-4, Claude, Mistral, LLaMA, Gemini), RAG, hybrid retrieval, LLM fine-tuning (QLoRA), prompt engineering, OCR, NLP, Computer Vision, Deep Learning, scikit-learn, PyTorch

**Data & Infra:** Pinecone, ChromaDB, FAISS, BM25, Azure OpenAI, Pandas, Docker

**Languages:** English, Tamil
