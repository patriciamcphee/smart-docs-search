// src/types/index.ts
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url: string;
  type: 'page' | 'heading' | 'content';
  score: number;
}

export interface SearchIndex {
  pages: Record<string, SearchResult>;
  index: any; // lunr index
}

export interface SearchOptions {
  apiEndpoint?: string;
  databaseConfig?: {
    uri: string;
    collection: string;
  };
  maxResults?: number;
  minScore?: number;
}
