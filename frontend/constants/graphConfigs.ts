import { AgentConfiguration, IndexConfiguration } from '@/types/graphTypes';

type StreamConfigurables = AgentConfiguration;
type IndexConfigurables = IndexConfiguration;

export const retrievalAssistantStreamConfig: StreamConfigurables = {
  // Chat model, as "provider/model". Defaults to the local Ollama model; set
  // NEXT_PUBLIC_QUERY_MODEL (e.g. "google-genai/gemini-1.5-flash") for cloud mode.
  queryModel:
    process.env.NEXT_PUBLIC_QUERY_MODEL || 'ollama/llama3.2',
  retrieverProvider: 'supabase',
  // Number of document chunks to retrieve per question. Higher = better recall
  // (less likely to miss a relevant chunk) at the cost of a longer prompt.
  k: 8,
};

/**
 * The configuration for the indexing/ingestion process.
 */
export const indexConfig: IndexConfigurables = {
  useSampleDocs: false,
  retrieverProvider: 'supabase',
};
