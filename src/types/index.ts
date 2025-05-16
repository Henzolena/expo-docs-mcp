export interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    path?: string;
    type?: string;
    title?: string;
    url?: string;
    lastUpdated?: string;
  };
}

export interface QueryResult {
  context: Document[];
  answer?: string;
}

export interface VectorDBItem {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  pageContent: string;
}

export interface MCPRequest {
  query: string;
  maxResults?: number;
  filters?: Record<string, any>;
}

export interface MCPResponse {
  context: Document[];
  sources: string[];
}
