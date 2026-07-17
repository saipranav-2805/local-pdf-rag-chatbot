import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import { reduceDocs } from '../shared/state.js';
/**
 * Represents the state of the retrieval graph / agent.
 */
export const AgentStateAnnotation = Annotation.Root({
    query: Annotation(),
    route: Annotation(),
    ...MessagesAnnotation.spec,
    /**
     * Populated by the retriever. This is a list of documents that the agent can reference.
     * @type {Document[]}
     */
    documents: Annotation({
        default: () => [],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        reducer: reduceDocs,
    }),
    // Additional attributes can be added here as needed
});
