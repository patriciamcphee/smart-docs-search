// src/utils/searchClient.ts
import lunr from 'lunr';
import mongoose from 'mongoose';

export class SearchClient {
  private options: SearchOptions;
  private searchIndex: SearchIndex | null = null;

  constructor(options: SearchOptions) {
    this.options = {
      maxResults: 10,
      minScore: 0.5,
      ...options
    };
  }

  async initialize(): Promise<void> {
    if (this.options.apiEndpoint) {
      await this.initializeFromAPI();
    } else if (this.options.databaseConfig) {
      await this.initializeFromDatabase();
    } else {
      await this.initializeFromLocal();
    }
  }

  private async initializeFromAPI(): Promise<void> {
    try {
      const response = await fetch(this.options.apiEndpoint!);
      const data = await response.json();
      this.searchIndex = {
        pages: data.pages,
        index: lunr.Index.load(data.index)
      };
    } catch (error) {
      console.error('Failed to initialize search from API:', error);
      throw error;
    }
  }

  private async initializeFromDatabase(): Promise<void> {
    try {
      const { uri, collection } = this.options.databaseConfig!;
      await mongoose.connect(uri);
      
      const SearchDocument = mongoose.model(collection, new mongoose.Schema({
        pages: Object,
        index: Object
      }));

      const data = await SearchDocument.findOne().lean();
      if (!data) throw new Error('No search index found in database');

      this.searchIndex = {
        pages: data.pages,
        index: lunr.Index.load(data.index)
      };
    } catch (error) {
      console.error('Failed to initialize search from database:', error);
      throw error;
    }
  }

  private async initializeFromLocal(): Promise<void> {
    try {
      const data = require('../searchIndex.json');
      this.searchIndex = {
        pages: data.pages,
        index: lunr.Index.load(data.index)
      };
    } catch (error) {
      console.error('Failed to initialize search from local file:', error);
      throw error;
    }
  }

  search(query: string): SearchResult[] {
    if (!this.searchIndex) {
      throw new Error('Search index not initialized');
    }

    const results = this.searchIndex.index.search(query);
    return results
      .filter(result => result.score >= (this.options.minScore || 0.5))
      .slice(0, this.options.maxResults)
      .map(result => ({
        ...this.searchIndex!.pages[result.ref],
        score: result.score
      }));
  }
}