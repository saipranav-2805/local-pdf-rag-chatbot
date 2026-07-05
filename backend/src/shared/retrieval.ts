import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { OllamaEmbeddings } from '@langchain/ollama';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseConfigurationAnnotation,
  ensureBaseConfiguration,
} from './configuration.js';

/**
 * Local, fully-free setup:
 * - Embeddings via Ollama (`nomic-embed-text`) running on http://localhost:11434
 * - Vector store is an in-process MemoryVectorStore.
 *
 * The ingestion graph and the retrieval graph both run inside the same
 * LangGraph dev server process, so we share ONE MemoryVectorStore instance
 * across both via this module-level singleton. That way documents added by the
 * ingestion graph are visible to the retrieval graph within the server's
 * lifetime. (Note: the store is in-memory and resets when the backend restarts.)
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

let sharedVectorStore: MemoryVectorStore | null = null;

function getVectorStore(): MemoryVectorStore {
  if (!sharedVectorStore) {
    const embeddings = new OllamaEmbeddings({
      model: OLLAMA_EMBEDDING_MODEL,
      baseUrl: OLLAMA_BASE_URL,
    });
    sharedVectorStore = new MemoryVectorStore(embeddings);
  }
  return sharedVectorStore;
}

/**
 * Wipe all previously-ingested documents and start a fresh, empty store.
 *
 * The ingestion graph calls this before adding a new upload so that each upload
 * starts from a clean slate. Without this, every PDF ever uploaded accumulates
 * in the same in-memory store, and retrieval can return chunks from an OLD
 * document instead of the one the user just uploaded.
 */
export function resetVectorStore(): void {
  const embeddings = new OllamaEmbeddings({
    model: OLLAMA_EMBEDDING_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });
  sharedVectorStore = new MemoryVectorStore(embeddings);
}

export async function makeMemoryRetriever(
  configuration: typeof BaseConfigurationAnnotation.State,
): Promise<VectorStoreRetriever> {
  const vectorStore = getVectorStore();
  const filterKwargs = configuration.filterKwargs;
  const hasFilter = filterKwargs && Object.keys(filterKwargs).length > 0;
  return vectorStore.asRetriever({
    k: configuration.k,
    filter: hasFilter
      ? (doc) =>
          Object.entries(filterKwargs).every(
            ([key, value]) => doc.metadata?.[key] === value,
          )
      : undefined,
  });
}

export async function makeRetriever(
  config: RunnableConfig,
): Promise<VectorStoreRetriever> {
  const configuration = ensureBaseConfiguration(config);
  // We keep the `retrieverProvider` config for template compatibility, but in
  // this local build everything is served from the in-memory store.
  switch (configuration.retrieverProvider) {
    case 'supabase':
    default:
      return makeMemoryRetriever(configuration);
  }
}
