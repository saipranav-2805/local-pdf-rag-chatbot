/**
 * Define the configurable parameters for the agent.
 */
import { RunnableConfig } from '@langchain/core/runnables';
/**
 * typeof ConfigurationAnnotation.State class for indexing and retrieval operations.
 *
 * This annotation defines the parameters needed for configuring the indexing and
 * retrieval processes, including user identification, embedding model selection,
 * retriever provider choice, and search parameters.
 */
export declare const BaseConfigurationAnnotation: import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<{
    /**
     * The vector store provider to use for retrieval.
     * Options are 'supabase', but you can add more providers here and create their own retriever functions
     */
    retrieverProvider: {
        (): import("@langchain/langgraph").LastValue<"supabase">;
        (annotation: import("@langchain/langgraph").SingleReducer<"supabase", "supabase">): import("@langchain/langgraph").BinaryOperatorAggregate<"supabase", "supabase">;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    /**
     * Additional keyword arguments to pass to the search function of the retriever for filtering.
     */
    filterKwargs: {
        (): import("@langchain/langgraph").LastValue<Record<string, any>>;
        (annotation: import("@langchain/langgraph").SingleReducer<Record<string, any>, Record<string, any>>): import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, any>, Record<string, any>>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    /**
     * The number of documents to retrieve.
     */
    k: {
        (): import("@langchain/langgraph").LastValue<number>;
        (annotation: import("@langchain/langgraph").SingleReducer<number, number>): import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
}>;
/**
 * Create an typeof BaseConfigurationAnnotation.State instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of typeof BaseConfigurationAnnotation.State with the specified configuration.
 */
export declare function ensureBaseConfiguration(config: RunnableConfig): typeof BaseConfigurationAnnotation.State;
