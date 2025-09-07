// src/index.d.ts

import { Plugin } from '@docusaurus/types';

export interface SmartSearchPluginOptions {
  /** Folders to exclude from indexing */
  excludedFolders?: string[];
  /** File prefixes to exclude from indexing */
  excludedPrefixes?: string[];
  /** Maximum number of search results to return */
  maxSearchResults?: number;
  /** Search index cache options */
  cacheEnabled?: boolean;
  /** Custom search index filename */
  searchIndexFilename?: string;
}

export interface SearchIndexEntry {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  last_update?: any;
  url: string;
  content: string;
  sections: SearchSection[];
}

export interface SearchSection {
  id: string;
  heading: string;
  level: number;
  content: string;
  url: string;
}

export interface SearchResult {
  type: 'document' | 'section';
  title?: string;
  heading?: string;
  url: string;
  previewContent?: string;
  parentTitle?: string;
  parentUrl?: string;
  last_update?: any;
  score: number;
  searchTerm?: string;
}

declare const smartSearchPlugin: (
  context: any,
  options?: SmartSearchPluginOptions
) => Plugin<SearchIndexEntry[]>;

export default smartSearchPlugin;