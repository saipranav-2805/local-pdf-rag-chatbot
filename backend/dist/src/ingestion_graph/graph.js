/**
 * This "graph" simply exposes an endpoint for a user to upload docs to be indexed.
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import fs from 'fs/promises';
import { IndexStateAnnotation } from './state.js';
import { makeRetriever, resetVectorStore } from '../shared/retrieval.js';
import { ensureIndexConfiguration, IndexConfigurationAnnotation, } from './configuration.js';
import { reduceDocs } from '../shared/state.js';
async function ingestDocs(state, config) {
    if (!config) {
        throw new Error('Configuration required to run index_docs.');
    }
    const configuration = ensureIndexConfiguration(config);
    let docs = state.docs;
    if (!docs || docs.length === 0) {
        if (configuration.useSampleDocs) {
            const fileContent = await fs.readFile(configuration.docsFile, 'utf-8');
            const serializedDocs = JSON.parse(fileContent);
            docs = reduceDocs([], serializedDocs);
        }
        else {
            throw new Error('No sample documents to index.');
        }
    }
    else {
        docs = reduceDocs([], docs);
    }
    // Split the documents into small, focused chunks before embedding. PDF pages
    // can be very large; embedding a whole page produces a "blurry" vector that
    // retrieves poorly, and stuffing whole pages into the prompt can blow past the
    // model's context window. ~1000-character chunks with a little overlap give
    // precise retrieval and keep each piece small.
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    // Log the operating mode for debugging deployed environments
    const cloudMode = (await import('../shared/retrieval.js')).isCloudMode();
    console.log(`[ingestDocs] mode=${cloudMode ? 'CLOUD' : 'LOCAL'}, docs=${docs.length}, splitDocs=${splitDocs.length}`);
    if (cloudMode) {
        console.log(`[ingestDocs] GOOGLE_API_KEY set: ${!!process.env.GOOGLE_API_KEY}, SUPABASE_URL set: ${!!process.env.SUPABASE_URL}, SUPABASE_SERVICE_ROLE_KEY set: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
        console.log(`[ingestDocs] EMBEDDING_MODEL: ${process.env.EMBEDDING_MODEL || 'text-embedding-004 (default)'}`);
    }
    // Clear any previously-ingested documents so each new upload starts from a
    // clean slate. This must happen BEFORE makeRetriever, which binds a retriever
    // to the current store instance. Prevents answers from leaking in from an
    // older PDF that was uploaded earlier. (Async because in cloud mode it deletes
    // rows from Supabase.)
    try {
        await resetVectorStore();
    }
    catch (resetErr) {
        console.error('[ingestDocs] resetVectorStore failed:', resetErr.message);
        throw new Error(`Reset vector store failed: ${resetErr.message}`);
    }
    const retriever = await makeRetriever(config);
    try {
        await retriever.addDocuments(splitDocs);
    }
    catch (addErr) {
        console.error('[ingestDocs] addDocuments failed:', addErr.message);
        // Surface the real error (e.g. bad API key, wrong embedding model, Supabase issue)
        throw new Error(`Failed to embed and store documents: ${addErr.message}`);
    }
    return { docs: 'delete' };
}
// Define the graph
const builder = new StateGraph(IndexStateAnnotation, IndexConfigurationAnnotation)
    .addNode('ingestDocs', ingestDocs)
    .addEdge(START, 'ingestDocs')
    .addEdge('ingestDocs', END);
// Compile into a graph object that you can invoke and deploy.
export const graph = builder
    .compile()
    .withConfig({ runName: 'IngestionGraph' });
