import { RunnableConfig } from '@langchain/core/runnables';
/**
 * The configuration for the agent.
 */
export declare const AgentConfigurationAnnotation: import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<{
    /**
     * The language model used for processing and refining queries.
     * Should be in the form: provider/model-name.
     */
    queryModel: {
        (): import("@langchain/langgraph").LastValue<string>;
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    retrieverProvider: {
        (): import("@langchain/langgraph").LastValue<"supabase">;
        (annotation: import("@langchain/langgraph").SingleReducer<"supabase", "supabase">): import("@langchain/langgraph").BinaryOperatorAggregate<"supabase", "supabase">;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    filterKwargs: {
        (): import("@langchain/langgraph").LastValue<Record<string, any>>;
        (annotation: import("@langchain/langgraph").SingleReducer<Record<string, any>, Record<string, any>>): import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, any>, Record<string, any>>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
    k: {
        (): import("@langchain/langgraph").LastValue<number>;
        (annotation: import("@langchain/langgraph").SingleReducer<number, number>): import("@langchain/langgraph").BinaryOperatorAggregate<number, number>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<S>;
    };
}>;
/**
 * Create a typeof ConfigurationAnnotation.State instance from a RunnableConfig object.
 *
 * @param config - The configuration object to use.
 * @returns An instance of typeof ConfigurationAnnotation.State with the specified configuration.
 */
export declare function ensureAgentConfiguration(config: RunnableConfig): typeof AgentConfigurationAnnotation.State;
