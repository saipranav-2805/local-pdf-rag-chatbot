-- ---------------------------------------------------------------------------
-- Supabase setup for the cloud (Gemini + Supabase) build of the RAG chatbot.
--
-- Run this ONCE in your Supabase project:
--   Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
--
-- It creates everything `SupabaseVectorStore` needs:
--   * the pgvector extension
--   * a `documents` table (id / content / metadata / embedding)
--   * a `match_documents` similarity-search function
--
-- IMPORTANT — embedding dimension:
--   The embedding column dimension MUST match the embedding model.
--   Google Gemini `text-embedding-004` (this project's default) returns 768
--   dimensions, so the column is vector(768). If you switch embedding models,
--   change 768 in BOTH the table column and the function signature to match.
-- ---------------------------------------------------------------------------

-- 1. Enable pgvector (safe to run repeatedly).
create extension if not exists vector;

-- 2. The table that stores each chunk + its embedding.
create table if not exists documents (
  id        bigserial primary key,
  content   text,                 -- the chunk text (LangChain `pageContent`)
  metadata  jsonb,                -- arbitrary metadata (source, page, etc.)
  embedding vector(768)           -- 768 = Gemini text-embedding-004
);

-- 3. Similarity-search function used by LangChain's SupabaseVectorStore.
--    Returns rows ordered by cosine similarity to `query_embedding`.
--    `filter` lets the retriever narrow results by metadata (jsonb contains).
create or replace function match_documents (
  query_embedding vector(768),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 4. (Optional but recommended) Approximate-nearest-neighbour index for speed.
--    Only helps once you have a meaningful number of rows; harmless to create now.
create index if not exists documents_embedding_idx
  on documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
