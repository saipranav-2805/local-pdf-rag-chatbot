import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { RunnableConfig } from '@langchain/core/runnables';
/** True when all cloud credentials are present. */
export declare function isCloudMode(): boolean;
/**
 * Wipe all previously-ingested documents so each new upload starts fresh.
 * Without this, uploads accumulate and retrieval can surface chunks from an
 * older document instead of the one the user just uploaded.
 *
 * - Local mode: replace the in-memory store with an empty one.
 * - Cloud mode: delete every row from the Supabase `documents` table.
 */
export declare function resetVectorStore(): Promise<void>;
export declare function makeRetriever(config: RunnableConfig): Promise<VectorStoreRetriever>;
