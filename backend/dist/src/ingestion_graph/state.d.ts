import { Document } from '@langchain/core/documents';
/**
 * Represents the state for document indexing and retrieval.
 *
 * This interface defines the structure of the index state, which includes
 * the documents to be indexed and the retriever used for searching
 * these documents.
 */
export declare const IndexStateAnnotation: import("@langchain/langgraph")._INTERNAL_ANNOTATION_ROOT<{
    /**
     * A list of documents that the agent can index.
     */
    docs: import("@langchain/langgraph").BinaryOperatorAggregate<Document<Record<string, any>>[], string | Document<Record<string, any>>[] | string[] | {
        [key: string]: any;
    }[]>;
}>;
export type IndexStateType = typeof IndexStateAnnotation.State;
