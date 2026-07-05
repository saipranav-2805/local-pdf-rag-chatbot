import { Client } from '@langchain/langgraph-sdk';
import { LangGraphBase } from './langgraph-base';

// Server client singleton instance
let clientInstance: LangGraphBase | null = null;

/**
 * Creates or returns a singleton instance of the LangGraph client for server-side use
 * @returns LangGraph Client instance
 */
export const createServerClient = () => {
  if (clientInstance) {
    return clientInstance;
  }

  if (!process.env.NEXT_PUBLIC_LANGGRAPH_API_URL) {
    throw new Error('NEXT_PUBLIC_LANGGRAPH_API_URL is not set');
  }

  // LANGCHAIN_API_KEY is only required to reach a deployed LangGraph Cloud
  // server. The local `langgraph:dev` server needs no auth, so we only send
  // the header when a key is actually provided.
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (process.env.LANGCHAIN_API_KEY) {
    defaultHeaders['X-Api-Key'] = process.env.LANGCHAIN_API_KEY;
  }

  const client = new Client({
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
    defaultHeaders,
  });

  clientInstance = new LangGraphBase(client);
  return clientInstance;
};

// Export all methods from the base class instance
export const langGraphServerClient = createServerClient();
