# Running this project locally (fully free, no API keys)

This clone was modified to run **100% locally and free** using [Ollama](https://ollama.com)
instead of OpenAI + Supabase. No API keys or cloud accounts are required.

## What was changed vs. the upstream template

| Piece | Upstream | This local build |
|-------|----------|------------------|
| Chat model | `openai/gpt-4o(-mini)` | `ollama/llama3.2` |
| Embeddings | OpenAI `text-embedding-3-small` | Ollama `nomic-embed-text` |
| Vector store | Supabase | In-memory (`MemoryVectorStore`) |
| Tracing | LangSmith on | off |

Files touched:
- `backend/src/shared/retrieval.ts` — Ollama embeddings + shared in-memory store
- `backend/src/retrieval_graph/configuration.ts` — default `queryModel`
- `backend/src/retrieval_graph/graph.ts` — structured-output uses `method: 'functionCalling'`
  (local models answer via tool call; the default Ollama path parses text and fails)
- `frontend/constants/graphConfigs.ts` — default `queryModel`
- `frontend/lib/langgraph-server.ts` — `LANGCHAIN_API_KEY` is now optional
  (the local dev server needs no auth; the original code threw on startup, which
  crashed both the /api/chat and /api/ingest routes)
- root `package.json` — `resolutions` pin `zod@3.25.76` and `tailwindcss@3.4.17`
- `backend/.env`, `frontend/.env` — tracing disabled

## Which URL do I open?

- **http://localhost:3000** — the app. This is the one you use.
- **http://localhost:2024** — the backend is a *headless API*. Opening it in a
  browser shows `404 Not Found` at `/`, which is expected (there is no web page
  there). Health check: `curl http://localhost:2024/info`. For a visual debugger,
  use LangGraph Studio: `https://smith.langchain.com/studio?baseUrl=http://localhost:2024`.

## Prerequisites (already installed on this machine)

- Node.js, Yarn
- Ollama, with two models pulled:
  ```bash
  ollama pull llama3.2          # chat (~2 GB)
  ollama pull nomic-embed-text  # embeddings (~275 MB)
  ```

## Start everything

```bash
# 1. Ollama server (leave running)
ollama serve

# 2. Backend — LangGraph API on http://localhost:2024
cd backend && yarn langgraph:dev

# 3. Frontend — Next.js UI on http://localhost:3000
cd frontend && yarn dev
```

Open http://localhost:3000, upload a small PDF (paperclip icon), then ask questions.

## Notes / limits

- The vector store is **in-memory**: ingested PDFs are lost when the backend restarts.
  Re-upload after a restart. (Swap back to Supabase in `retrieval.ts` for persistence.)
- `llama3.2` is a small local model — answers are decent but not GPT-4 quality. Pull a
  larger model (e.g. `ollama pull llama3.1:8b`) and update the `queryModel` values to upgrade.
