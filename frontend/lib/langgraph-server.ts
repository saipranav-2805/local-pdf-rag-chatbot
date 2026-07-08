import { Client } from '@langchain/langgraph-sdk';
import { LangGraphBase } from './langgraph-base';

// Server client singleton instance
let clientInstance: LangGraphBase | null = null;

/**
 * Creates or returns a singleton instance of the LangGraph client for server-side use
 * @returns LangGraph Client instance
 */
export const createServerClient = (): LangGraphBase => {
  if (clientInstance) {
    return clientInstance;
  }

  if (!process.env.NEXT_PUBLIC_LANGGRAPH_API_URL) {
    throw new Error('NEXT_PUBLIC_LANGGRAPH_API_URL is not set in environment variables.');
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

// Export a proxy that delegates lazily to the singleton instance to prevent build-time crashes
export const langGraphServerClient = new Proxy({} as LangGraphBase, {
  get(target, prop, receiver) {
    const instance = createServerClient();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
