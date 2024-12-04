// types/index.d.ts

/**
 * Represents a search result document in the index
 */
export interface SearchDocument {
  /** Unique identifier for the document */
  id: string;
  /** Document title */
  title: string;
  /** Document description or excerpt */
  description?: string;
  /** Array of keywords associated with the document */
  keywords?: string[];
  /** URL path to the document */
  url: string;
  /** Last update information */
  last_update?: {
    date: string;
    author?: string;
  };
}

/**
 * Configuration options for database connections
 */
export interface DatabaseConfig {
  /** MongoDB connection URI */
  dbUri: string;
  /** Database name */
  dbName: string;
  /** Collection name */
  collection: string;
  /** Optional connection options */
  options?: Record<string, unknown>;
}

/**
 * Configuration for the search plugin
 */
export interface SearchPluginConfig {
  /** Path to the static search index file */
  indexPath?: string;
  /** API endpoint for remote search */
  apiEndpoint?: string;
  /** Database configuration for MongoDB */
  dbConfig?: DatabaseConfig;
  /** Array of paths to exclude from search */
  excludePaths?: string[];
  /** Custom document processors */
  preprocessors?: Array<(doc: SearchDocument) => SearchDocument>;
  /** Version configuration */
}

/**
 * Search hook options
 */
export interface UseSearchOptions {
  /** Path to search index */
  indexPath?: string;
  /** Remote API endpoint */
  apiEndpoint?: string;
  /** Fuse.js search options */
  fuseOptions?: {
    includeScore?: boolean;
    threshold?: number;
    minMatchCharLength?: number;
    keys?: Array<string | { name: string; weight: number }>;
  };
  /** Debounce time in milliseconds */
  debounceMs?: number;
}

/**
 * Result from the useSearch hook
 */
export interface SearchHookResult {
  /** Search function */
  search: (query: string) => Promise<void>;
  /** Search results */
  results: SearchDocument[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Raw search index data */
  searchIndex: SearchDocument[];
}

/**
 * Main plugin class
 */
export class DocsSearchPlugin {
  constructor(config?: SearchPluginConfig);
  
  /**
   * Returns plugin configuration for Docusaurus
   */
  docusaurusPlugin(): {
    name: string;
    loadContent: () => Promise<any>;
    contentLoaded: (args: { content: any; actions: any }) => Promise<void>;
    getThemePath: () => string;
    getClientModules: () => string[];
  };

  /**
   * Returns plugin configuration for Nextra
   */
  nextraPlugin(): {
    name: string;
    extends: {
      theme: {
        layout: string;
      };
    };
  };
}

/**
 * React hook for performing searches
 */
export function useSearch(options: UseSearchOptions): SearchHookResult;

