# Making this a resume project — full procedure

This guide takes the project from "runs on my localhost" to "a project I can put on
my resume, host on my GitHub, optionally deploy live, and confidently explain in an
interview."

> **Read this first — the honest framing.**
> This repo started as a well-known **open-source template**
> ([`mayooear/ai-pdf-chatbot-langchain`](https://github.com/mayooear/ai-pdf-chatbot-langchain),
> the companion project to the O'Reilly book *Learning LangChain*). Recruiters and
> AI engineers have seen it. So the goal is **not** to pretend you built it from
> scratch — it's to (1) credit the original, (2) add real work of your own, and
> (3) understand it well enough to defend it. Your genuine contribution so far is the
> **full local/offline re-engineering** (Ollama instead of OpenAI + Supabase), plus
> the bug/dependency fixes. That is legitimate, describable engineering.

---

## Phase 1 — Own it on GitHub (with proper credit)

The repo currently points at the original author's remote. Make it yours:

```bash
cd ~/ai-pdf-chatbot

# 1. Remove the original remote
git remote remove origin

# 2. (Recommended) Start a clean history so it's clearly your repo,
#    while keeping the LICENSE + attribution in the README (see Phase 1b).
rm -rf .git
git init
git add -A
git commit -m "Local, fully-offline RAG chatbot (Ollama) — based on ai-pdf-chatbot-langchain template"

# 3. Create a NEW empty repo on github.com (via the website):
#    https://github.com/new  ->  name it e.g. "local-pdf-rag-chatbot"
#    Do NOT initialize it with a README (you already have one).

# 4. Point your local repo at your new GitHub repo and push
#    (replace YOUR_USERNAME and REPO_NAME):
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

**Authentication note:** you don't have the `gh` CLI installed. When you `git push`,
GitHub will ask for credentials — use a **Personal Access Token** as the password
(github.com → Settings → Developer settings → Personal access tokens → *Fine-grained*
→ give it `repo` access). Or install the CLI: `brew install gh && gh auth login`.

### Phase 1b — Keep attribution (this is what makes it honest + legal)

The template is MIT-licensed, which *requires* keeping the license/copyright. Your
`README.md` should open with a line like:

> Based on the open-source [ai-pdf-chatbot-langchain](https://github.com/mayooear/ai-pdf-chatbot-langchain)
> template (MIT). I re-engineered it to run fully locally/offline with Ollama and
> added [list your features].

Keep the original `LICENSE` file. Optionally add your own copyright line to it.

---

## Phase 2 — Add genuine differentiation (make it clearly *yours*)

Right now your original work = the local Ollama conversion + bug fixes. Add 1–2 real
features so the project is more than a re-skinned template. Good, resume-worthy options
(ranked by impact/effort — ask me to build any of these):

1. **Persistent vector storage** — replace the in-memory store with a local file-backed
   store (e.g. `HNSWLib` or a local Postgres+pgvector via Docker) so uploaded PDFs
   survive restarts. *Shows: data persistence, vector DBs.*
2. **Source citations in the UI** — surface which PDF chunks were used for each answer.
   *Shows: full-stack, RAG explainability.*
3. **Document management** — a sidebar listing uploaded docs with delete. *Shows: CRUD, state.*
4. **Evaluation script** — a small script that runs Q/A pairs and scores retrieval/answers.
   *Shows: you think about quality, not just features. Very strong signal.*
5. **Model/provider switch in the UI** — dropdown to pick llama3.2 vs another Ollama model.
   *Shows: you understand the provider abstraction you refactored.*

---

## Phase 3 — Deploy for a live link (optional but strong)

⚠️ **Key constraint:** the current **Ollama-local version cannot be deployed to free
serverless hosts** (Vercel/Netlify can't run Ollama + multi-GB models). You have two
honest paths:

### Path A — Live public link (switch deployed version to free cloud APIs)
Create a separate `deploy` branch that uses free-tier cloud services instead of Ollama:
- **LLM + embeddings:** Google Gemini via [Google AI Studio](https://aistudio.google.com)
  — genuinely free tier, just needs a Google login. (Package: `@langchain/google-genai`.)
- **Vector store:** [Supabase](https://supabase.com) free project (the template already
  supports it — you'd revert `retrieval.ts` to the Supabase version + run their SQL for
  the `documents` table + `match_documents` function).
- **Frontend:** deploy the Next.js app to **Vercel** (free) — connects to your repo,
  auto-builds.
- **Backend:** deploy the LangGraph server to **LangGraph Cloud** (free tier) or a small
  cloud VM.

I can do this whole branch for you — it's the most involved part.

### Path B — Local + demo video (no accounts, zero cost)
Keep the free local version. Record a 60–90s screen capture of uploading a PDF and
chatting, add 3–4 screenshots to the README, and link the GitHub repo on your resume.
**This is completely legitimate** and common for resume projects — many hiring managers
prefer a clear repo + video over a fragile live link.

---

## Phase 4 — Resume bullets + interview prep

### Suggested resume bullets (accurate to what you actually did)
Pick 2–3, tune the wording to your style:

- Re-engineered an open-source **LangGraph/LangChain RAG** chatbot to run **fully
  offline and free**, replacing OpenAI + Supabase with **Ollama** (`llama3.2` +
  `nomic-embed-text`) and a local vector store — eliminating all paid API dependencies.
- Refactored the retrieval layer behind a shared interface to swap embedding and
  vector-store providers without touching the ingestion/retrieval graphs.
- Diagnosed and fixed a **structured-output incompatibility** between local LLMs and
  LangChain (models replied via tool calls while the parser read message text),
  plus `zod`/`tailwind` dependency conflicts across a Yarn monorepo.
- Built/operated the end-to-end **RAG pipeline**: PDF ingestion → embeddings → vector
  similarity retrieval → routed LLM generation with source grounding, on a **Next.js +
  LangGraph** stack with streaming (SSE) responses.

### Interview cheat-sheet — be able to explain ALL of these
If you can explain these, the project is a genuine asset. If you can't yet, ask me to
walk you through any of them:

- **What is RAG and why use it?** (ground LLM answers in your documents; reduce
  hallucination; avoid retraining.)
- **The two graphs:** *ingestion* (PDF → text → embeddings → vector store) and
  *retrieval* (question → route → retrieve top-k chunks → generate answer).
- **Embeddings & vector similarity:** text → vectors; nearest-neighbour (cosine) search
  returns the most relevant chunks.
- **The routing node:** decides "retrieve from docs" vs "answer directly" using
  structured output — and *why that broke on a local model and how you fixed it*.
- **Streaming:** why answers stream token-by-token (SSE) and how the frontend consumes it.
- **What you changed vs. the template, and the trade-offs** (in-memory store = simple but
  non-persistent; local model = free but lower quality than GPT-4).
- **The architecture diagram** (frontend :3000 ↔ backend :2024 ↔ Ollama :11434).

---

## Suggested order of operations
1. Decide Phase 3 path (live link vs video) — this affects whether you keep Ollama.
2. Add at least one Phase 2 feature.
3. Do Phase 1 (push to your GitHub) with a strong README.
4. Write bullets + rehearse the cheat-sheet.

Ask me to execute any phase — I can build the features, write the README, create the
cloud-deploy branch, or draft the README screenshots section.
