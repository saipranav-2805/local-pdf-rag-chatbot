import { OllamaEmbeddings } from '@langchain/ollama';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { ensureBaseConfiguration } from './configuration.js';
/**
 * This file selects the embeddings + vector store based on environment
 * variables, so the SAME code runs in two modes:
 *
 *  LOCAL (default): Ollama embeddings (`nomic-embed-text`) + in-memory store.
 *                   Free, offline, no accounts. Resets on restart.
 *
 *  CLOUD:           Google Gemini embeddings + Supabase (Postgres/pgvector).
 *                   Enabled automatically when GOOGLE_API_KEY, SUPABASE_URL and
 *                   SUPABASE_SERVICE_ROLE_KEY are all set. Persistent, and
 *                   deployable to serverless hosts (Vercel) where an in-memory
 *                   store would not survive between requests.
 */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
const GEMINI_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-2';
/** True when all cloud credentials are present. */
export function isCloudMode() {
    return Boolean(process.env.GOOGLE_API_KEY &&
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY);
}
/** Build the embeddings client for the current mode. */
function makeEmbeddings() {
    if (isCloudMode()) {
        return new GoogleGenerativeAIEmbeddings({
            model: GEMINI_EMBEDDING_MODEL,
            // apiKey is read from process.env.GOOGLE_API_KEY automatically.
        });
    }
    return new OllamaEmbeddings({
        model: OLLAMA_EMBEDDING_MODEL,
        baseUrl: OLLAMA_BASE_URL,
    });
}
// ---------------------------------------------------------------------------
// LOCAL: in-memory vector store (module-level singleton, shared by both graphs)
// ---------------------------------------------------------------------------
let sharedVectorStore = null;
function getMemoryVectorStore() {
    if (!sharedVectorStore) {
        sharedVectorStore = new MemoryVectorStore(makeEmbeddings());
    }
    return sharedVectorStore;
}
// ---------------------------------------------------------------------------
// CLOUD: Supabase client (cached)
// ---------------------------------------------------------------------------
let supabaseClient = null;
function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    return supabaseClient;
}
function makeSupabaseVectorStore() {
    return new SupabaseVectorStore(makeEmbeddings(), {
        client: getSupabaseClient(),
        tableName: 'documents',
        queryName: 'match_documents',
    });
}
/**
 * Wipe all previously-ingested documents so each new upload starts fresh.
 * Without this, uploads accumulate and retrieval can surface chunks from an
 * older document instead of the one the user just uploaded.
 *
 * - Local mode: replace the in-memory store with an empty one.
 * - Cloud mode: delete every row from the Supabase `documents` table.
 */
export async function resetVectorStore() {
    if (isCloudMode()) {
        // Supabase requires a filter on delete; `id >= 0` matches all rows.
        const { error } = await getSupabaseClient()
            .from('documents')
            .delete()
            .gte('id', 0);
        if (error) {
            throw new Error(`Failed to clear Supabase documents: ${error.message}`);
        }
        return;
    }
    sharedVectorStore = new MemoryVectorStore(makeEmbeddings());
}
// ---------------------------------------------------------------------------
// Retriever factory
// ---------------------------------------------------------------------------
export async function makeRetriever(config) {
    const configuration = ensureBaseConfiguration(config);
    const filterKwargs = configuration.filterKwargs;
    const hasFilter = filterKwargs && Object.keys(filterKwargs).length > 0;
    if (isCloudMode()) {
        const vectorStore = makeSupabaseVectorStore();
        return vectorStore.asRetriever({
            k: configuration.k,
            filter: hasFilter ? filterKwargs : undefined,
        });
    }
    const vectorStore = getMemoryVectorStore();
    return vectorStore.asRetriever({
        k: configuration.k,
        filter: hasFilter
            ? (doc) => Object.entries(filterKwargs).every(([key, value]) => doc.metadata?.[key] === value)
            : undefined,
    });
}
