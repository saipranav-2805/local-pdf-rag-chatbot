import { Annotation } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseConfigurationAnnotation,
  ensureBaseConfiguration,
} from '../shared/configuration.js';

/**
 * The configuration for the agent.
 */
export const AgentConfigurationAnnotation = Annotation.Root({
  ...BaseConfigurationAnnotation.spec,

  // models
  /**
   * The language model used for processing and refining queries.
   * Should be in the form: provider/model-name.
   */
  queryModel: Annotation<string>,
});

/**
 * Create a typeof ConfigurationAnnotation.State instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of typeof ConfigurationAnnotation.State with the specified configuration.
 */
export function ensureAgentConfiguration(
  config: RunnableConfig,
): typeof AgentConfigurationAnnotation.State {
  const configurable = (config?.configurable || {}) as Partial<
    typeof AgentConfigurationAnnotation.State
  >;
  const baseConfig = ensureBaseConfiguration(config);
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
  let queryModel =
    configurable.queryModel ||
    process.env.QUERY_MODEL ||
    (hasGoogleKey ? 'google-genai/gemini-2.0-flash-lite' : 'ollama/llama3.2');

  // Normalize deprecated / unavailable Gemini models to gemini-2.0-flash-lite.
  // Uses regex so it catches any variant (with or without provider prefix,
  // with or without patch suffix) rather than exact-string matching.
  queryModel = queryModel
    .replace(/gemini-1\.5(-flash|-pro)?(-\d+)?(-latest)?/, 'gemini-2.0-flash-lite')
    .replace(/gemini-2\.5-flash(-\d+)?(-preview(-[\w-]+)?)?/, 'gemini-2.0-flash-lite')
    .replace(/gemini-2\.0-flash(?!-lite)(-\d+)?(-preview(-[\w-]+)?)?/, 'gemini-2.0-flash-lite');

  return {
    ...baseConfig,
    queryModel,
  };
}
