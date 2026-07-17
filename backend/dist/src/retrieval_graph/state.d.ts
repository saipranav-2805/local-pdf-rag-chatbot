import { Document } from '@langchain/core/documents';
/**
 * Represents the state of the retrieval graph / agent.
 */
export declare const AgentStateAnnotation: import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<{
    /**
     * Populated by the retriever. This is a list of documents that the agent can reference.
     * @type {Document[]}
     */
    documents: import("@langchain/langgraph").BinaryOperatorAggregate<Document<Record<string, any>>[], string | Document<Record<string, any>>[] | string[] | {
        [key: string]: any;
    }[]>;
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/core/messages").BaseMessage[], import("@langchain/langgraph").Messages>;
    query: import("@langchain/langgraph").LastValue<string>;
    route: import("@langchain/langgraph").LastValue<string>;
}>;
