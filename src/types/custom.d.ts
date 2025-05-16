// Custom declarations for missing type definitions
declare module 'langchain/vectorstores/hnswlib' {
  import { Embeddings } from '@langchain/core/embeddings';
  import { Document } from 'langchain/document';
  
  export class HNSWLib {
    static fromDocuments(
      docs: Document[],
      embeddings: Embeddings
    ): Promise<HNSWLib>;
    
    static load(
      directory: string,
      embeddings: Embeddings
    ): Promise<HNSWLib>;
    
    save(directory: string): Promise<void>;
    
    similaritySearch(
      query: string,
      k?: number
    ): Promise<Document[]>;
  }
}
