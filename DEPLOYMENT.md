# Deploying the RAG chatbot for a live link (free)

This deploys the **cloud** build — Google Gemini (LLM + embeddings) + Supabase
(vector store) + a hosted LangGraph backend + the Next.js frontend on Vercel.
All on free tiers. End result: a public URL you can put on your resume.

```
Browser ──▶ Vercel (Next.js frontend) ──server-side──▶ Render (LangGraph backend)
                                                              │
                                              Gemini API ◀────┼────▶ Supabase (pgvector)
```

> **Free-tier caveats (be ready to explain these):**
> - Render's free web service **sleeps after ~15 min idle**; the first request
>   afterward cold-starts for ~30–60s. Normal for a demo link.
> - Gemini and Supabase free tiers have generous but finite quotas — fine for a
>   portfolio, not production traffic.

You'll need four free accounts: **Google AI Studio**, **Supabase**, **Render**,
**Vercel**. Total time ~20–30 min. Do the steps in order.

---

## Step 1 — Google Gemini API key

1. Go to https://aistudio.google.com/apikey (sign in with any Google account).
2. Click **Create API key** → copy it. This is your `GOOGLE_API_KEY`.

## Step 2 — Supabase project + database

1. Go to https://supabase.com → **New project** (free plan). Pick a name + a
   strong DB password. Wait ~2 min for it to provision.
2. Left sidebar → **SQL Editor** → **New query**. Open
   [`backend/supabase_setup.sql`](backend/supabase_setup.sql) in this repo,
   paste its full contents, and click **Run**. You should see "Success".
3. Left sidebar → **Project Settings** → **API**. Copy:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role** secret key → this is `SUPABASE_SERVICE_ROLE_KEY`
     (server-side only — never put it in the frontend).

## Step 3 — Push this branch to GitHub

Render and Vercel deploy from GitHub. Make sure the `cloud-deploy` branch is
pushed:

```bash
git push -u origin cloud-deploy
```

## Step 4 — Deploy the backend to Render

1. Go to https://render.com → sign in with GitHub.
2. **New** → **Blueprint** → select this repo → branch **`cloud-deploy`**.
   Render reads [`render.yaml`](render.yaml) and proposes the `pdf-rag-backend`
   service. Click **Apply**.
3. Open the service → **Environment** → set the three secrets from Steps 1–2:
   - `GOOGLE_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

   (`QUERY_MODEL` and `EMBEDDING_MODEL` are already set by the blueprint.)
4. Let it build/deploy. When live, copy the service URL, e.g.
   `https://pdf-rag-backend.onrender.com`. Verify it's serving the graphs:

   ```bash
   curl -s -X POST https://pdf-rag-backend.onrender.com/assistants/search \
     -H "Content-Type: application/json" -d '{}'
   # expect a JSON array listing ingestion_graph and retrieval_graph
   ```

## Step 5 — Deploy the frontend to Vercel

1. Go to https://vercel.com → sign in with GitHub → **Add New… → Project** →
   import this repo.
2. **Root Directory**: set to **`frontend`**.
3. Framework preset auto-detects **Next.js**. Leave build/output defaults.
4. **Environment Variables** — add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_LANGGRAPH_API_URL` | your Render URL from Step 4 |
   | `NEXT_PUBLIC_QUERY_MODEL` | `google-genai/gemini-2.0-flash` |
   | `LANGGRAPH_INGESTION_ASSISTANT_ID` | `ingestion_graph` |
   | `LANGGRAPH_RETRIEVAL_ASSISTANT_ID` | `retrieval_graph` |
   | `LANGCHAIN_TRACING_V2` | `false` |

5. **Deploy**. Vercel gives you a public URL, e.g.
   `https://your-app.vercel.app`. **That is your live link.**

## Step 6 — Verify end to end

1. Open the Vercel URL.
2. Upload a small PDF (< 10 MB). Wait for "ingested".
3. Ask a question about its contents. You should get a grounded answer.

If the first action is slow, it's the Render cold start — retry once it's warm.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Chat/ingest 500s immediately | Backend env vars missing — confirm all three secrets are set on Render, then redeploy. |
| "relation \"documents\" does not exist" | Step 2 SQL didn't run — re-run `supabase_setup.sql`. |
| Dimension mismatch on insert | Embedding model ≠ SQL vector size. `text-embedding-004` = 768; keep both in sync. |
| First request always slow | Render free tier cold start (expected). Upgrade to keep it warm, or accept it for a demo. |
| Answers seem to ignore the PDF | Confirm cloud mode is active (all three secrets set) so Supabase is used, not the in-memory store. |

## Switching a model

- Chat model: change `QUERY_MODEL` (Render) **and** `NEXT_PUBLIC_QUERY_MODEL`
  (Vercel) to another `google-genai/<model>` id.
- Embedding model: change `EMBEDDING_MODEL` **and** the `vector(N)` dimension in
  `supabase_setup.sql` to match, then re-run the SQL and re-ingest.
