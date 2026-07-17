/**
 * Define the configurable parameters for the agent.
 */
import { Annotation } from '@langchain/langgraph';
/**
 * typeof ConfigurationAnnotation.State class for indexing and retrieval operations.
 *
 * This annotation defines the parameters needed for configuring the indexing and
 * retrieval processes, including user identification, embedding model selection,
 * retriever provider choice, and search parameters.
 */
export const BaseConfigurationAnnotation = Annotation.Root({
    /**
     * The vector store provider to use for retrieval.
     * Options are 'supabase', but you can add more providers here and create their own retriever functions
     */
    retrieverProvider: (Annotation),
    /**
     * Additional keyword arguments to pass to the search function of the retriever for filtering.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filterKwargs: (Annotation),
    /**
     * The number of documents to retrieve.
     */
    k: (Annotation),
});
/**
 * Create an typeof BaseConfigurationAnnotation.State instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of typeof BaseConfigurationAnnotation.State with the specified configuration.
 */
export function ensureBaseConfiguration(config) {
    const configurable = (config?.configurable || {});
    return {
        retrieverProvider: configurable.retrieverProvider || 'supabase',
        filterKwargs: configurable.filterKwargs || {},
        k: configurable.k || 8,
    };
}
