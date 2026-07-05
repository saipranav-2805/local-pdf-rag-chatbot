import { AgentConfiguration, IndexConfiguration } from '@/types/graphTypes';

type StreamConfigurables = AgentConfiguration;
type IndexConfigurables = IndexConfiguration;

export const retrievalAssistantStreamConfig: StreamConfigurables = {
  queryModel: 'ollama/llama3.2',
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
