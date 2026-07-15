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
  let queryModel =
    configurable.queryModel ||
    process.env.QUERY_MODEL ||
    'ollama/llama3.2';

  // Map gemini-2.0-flash to gemini-1.5-flash due to free-tier restrictions (limit: 0 on 2.0-flash)
  if (queryModel === 'google-genai/gemini-2.0-flash') {
    queryModel = 'google-genai/gemini-1.5-flash';
  }

  return {
    ...baseConfig,
    queryModel,
  };
}
