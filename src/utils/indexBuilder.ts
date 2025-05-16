import path from 'path';
import { processDocuments } from './documentProcessor';
import { createVectorStore } from './vectorStore';

/**
 * Build the documentation index from the Expo repository
 */
export async function buildIndex() {
  const repoPath = path.resolve(process.cwd(), 'docs-source');
  console.log(`Building index from repository at ${repoPath}`);
  
  try {
    // Process all documentation files
    const documents = await processDocuments(repoPath);
    
    // Create the vector store
    await createVectorStore(documents);
    
    console.log('Index built successfully!');
    return true;
  } catch (error) {
    console.error('Error building index:', error);
    return false;
  }
}
