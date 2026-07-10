import { AgentConfiguration, IndexConfiguration } from '@/types/graphTypes';

type StreamConfigurables = AgentConfiguration;
type IndexConfigurables = IndexConfiguration;

export const retrievalAssistantStreamConfig: Partial<StreamConfigurables> = {
  // Chat model, as "provider/model". Only sent if explicitly set via
  // NEXT_PUBLIC_QUERY_MODEL. If omitted, the backend uses its own QUERY_MODEL
  // env var (e.g. google-genai/gemini-2.0-flash on Render).
  ...(process.env.NEXT_PUBLIC_QUERY_MODEL
    ? { queryModel: process.env.NEXT_PUBLIC_QUERY_MODEL }
    : {}),
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
