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
--   Google Gemini `gemini-embedding-2` returns 3072 dimensions, so the
--   column is vector(3072). If you switch embedding models, change 3072
--   in BOTH the table column and the function signature to match.
--
-- INDEX NOTE:
--   We use HNSW (not ivfflat) because ivfflat only supports up to 2000
--   dimensions, and gemini-embedding-2 outputs 3072. HNSW supports up to
--   4000 dimensions and is generally faster for smaller datasets.
-- ---------------------------------------------------------------------------

-- 1. Enable pgvector (safe to run repeatedly).
create extension if not exists vector;

-- 2. Drop old table and function if they exist (from the deprecated
--    text-embedding-004 model which used 768 dimensions).
drop function if exists match_documents(vector, int, jsonb);
drop index if exists documents_embedding_idx;
drop table if exists documents;

-- 3. The table that stores each chunk + its embedding.
create table documents (
  id        bigserial primary key,
  content   text,                 -- the chunk text (LangChain `pageContent`)
  metadata  jsonb,                -- arbitrary metadata (source, page, etc.)
  embedding vector(3072)          -- 3072 = Gemini gemini-embedding-2
);

-- 4. Similarity-search function used by LangChain's SupabaseVectorStore.
--    Returns rows ordered by cosine similarity to `query_embedding`.
--    `filter` lets the retriever narrow results by metadata (jsonb contains).
create or replace function match_documents (
  query_embedding vector(3072),
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

-- 5. Vector index.
--    NOTE: Supabase's pgvector limits HNSW and IVFFlat indexes to ≤2000
--    dimensions. gemini-embedding-2 outputs 3072, so no ANN index is
--    possible. Exact sequential scan is used instead — perfectly fast for
--    demo-sized datasets (hundreds to low-thousands of rows).
