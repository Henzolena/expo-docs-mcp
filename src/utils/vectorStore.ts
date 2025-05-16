import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Document as CustomDocument } from '../types';
import { OpenAIEmbeddings } from '@langchain/openai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Load environment variables
dotenv.config();

const vectorStorePath = process.env.VECTOR_STORE_PATH || './data/vector_store';

/**
 * Create a vector store from processed documents
 */
export async function createVectorStore(documents: CustomDocument[]): Promise<HNSWLib> {
  console.log('Creating vector store...');
  
  // Convert our custom document format to LangChain document format
  const langchainDocs = documents.map(doc => {
    return new Document({
      pageContent: doc.content,
      metadata: {
        ...doc.metadata,
        id: doc.id
      }
    });
  });

  // Split documents into smaller chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Aim for chunks of this size
    chunkOverlap: 200, // Overlap chunks to maintain context
  });
  const splitDocs = await textSplitter.splitDocuments(langchainDocs);
  console.log(`Split ${langchainDocs.length} documents into ${splitDocs.length} chunks for embedding.`);
  
  const embeddings = new OpenAIEmbeddings({
    batchSize: 32,        // How many documents to send to OpenAI API in one go (default 512, max 2048 for ada-002)
    maxConcurrency: 3,    // How many parallel requests to OpenAI (default 5)
    // maxRetries is 6 by default, which is reasonable.
  });

  const totalChunksToEmbed = splitDocs.length;
  if (totalChunksToEmbed === 0) {
    console.log("No document chunks to process. Vector store will not be created.");
    // Depending on desired behavior, either return null, an empty store, or throw error
    // For now, let's throw, as an empty store might cause issues later.
    throw new Error("No document chunks available to create the vector store.");
  }

  let vectorStore: HNSWLib | null = null;
  let embeddedChunksCount = 0;
  const appLevelBatchSize = 500; // How many chunks to add to HNSWLib at a time for progress reporting

  console.log(`Starting embedding process for ${totalChunksToEmbed} chunks...`);

  for (let i = 0; i < totalChunksToEmbed; i += appLevelBatchSize) {
    const currentBatch = splitDocs.slice(i, Math.min(i + appLevelBatchSize, totalChunksToEmbed));
    
    if (currentBatch.length === 0) continue;

    if (!vectorStore) {
      // Initialize the vector store with the first batch
      // This also sets up the dimensionality of the HNSWLib index based on the first embeddings
      vectorStore = await HNSWLib.fromDocuments(currentBatch, embeddings);
    } else {
      // Add subsequent batches to the existing store
      await vectorStore.addDocuments(currentBatch);
    }
    
    embeddedChunksCount += currentBatch.length;
    const percentage = ((embeddedChunksCount / totalChunksToEmbed) * 100).toFixed(2);
    console.log(`Embedding progress: ${embeddedChunksCount} / ${totalChunksToEmbed} chunks (${percentage}%) processed.`);
  }
  
  if (!vectorStore) {
     // This case should ideally be caught by the totalChunksToEmbed === 0 check earlier
    throw new Error("Vector store initialization failed unexpectedly.");
  }

  await vectorStore.save(vectorStorePath);
  console.log(`Vector store created and saved to ${vectorStorePath}`);
  return vectorStore;
}

/**
 * Load an existing vector store
 */
export async function loadVectorStore(): Promise<HNSWLib | null> {
  console.log('Loading vector store...');
  
  if (!fs.existsSync(vectorStorePath)) {
    console.log('Vector store does not exist yet');
    return null;
  }
  
  try {
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await HNSWLib.load(vectorStorePath, embeddings);
    console.log('Vector store loaded successfully');
    return vectorStore;
  } catch (error) {
    console.error('Error loading vector store:', error);
    return null;
  }
}

/**
 * Query the vector store
 */
export async function queryVectorStore(query: string, maxResults: number = 5): Promise<CustomDocument[]> {
  console.log(`Querying vector store for: "${query}"`);
  
  const vectorStore = await loadVectorStore();
  
  if (!vectorStore) {
    throw new Error('Vector store not initialized');
  }
  
  const results = await vectorStore.similaritySearch(query, maxResults);
  
  // Convert back to our custom document format
  return results.map((result: any) => {
    // Ensure metadata.path is relative, using the id (which is based on relativePath)
    // The original absolute path was stored as result.metadata.path during indexing.
    // For client consumption, a relative path or the URL is more useful.
    // The result.metadata.id is already the relative path or relativePath-comment-index.
    // We can derive a clean relative path from it for the 'path' field in metadata.
    let relativePathForMetadata = result.metadata.id;
    if (result.metadata.id.includes('-comment-')) {
      relativePathForMetadata = result.metadata.id.substring(0, result.metadata.id.lastIndexOf('-comment-'));
    }

    return {
      id: result.metadata.id, // Unique identifier for the chunk
      content: result.pageContent,
      metadata: {
        ...result.metadata, // Spread other original metadata like source, type, title, url
        path: relativePathForMetadata, // Explicitly set path to be relative
      }
    };
  });
}
