import { Client } from '@langchain/langgraph-sdk';
import { LangGraphBase } from './langgraph-base';

// Frontend client singleton instance
let clientInstance: LangGraphBase | null = null;

/**
 * Creates or returns a singleton instance of the LangGraph client for frontend use
 * @returns LangGraph Client instance
 */
export const createClient = (): LangGraphBase => {
  if (clientInstance) {
    return clientInstance;
  }

  if (!process.env.NEXT_PUBLIC_LANGGRAPH_API_URL) {
    throw new Error('NEXT_PUBLIC_LANGGRAPH_API_URL is not set in environment variables.');
  }

  const client = new Client({
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
  });

  clientInstance = new LangGraphBase(client);
  return clientInstance;
};

// Export a proxy that delegates lazily to the singleton instance to prevent build-time crashes
export const client = new Proxy({} as LangGraphBase, {
  get(target, prop, receiver) {
    const instance = createClient();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
