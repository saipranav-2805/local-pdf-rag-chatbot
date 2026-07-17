import { Document } from '@langchain/core/documents';
/**
 * Reduces the document array based on the provided new documents or actions.
 *
 * @param existing - The existing array of documents.
 * @param newDocs - The new documents or actions to apply.
 * @returns The updated array of documents.
 */
export declare function reduceDocs(existing?: Document[], newDocs?: Document[] | {
    [key: string]: any;
}[] | string[] | string | 'delete'): Document[];
