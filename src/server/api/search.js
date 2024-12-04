// src/server/api/search.js
import { MongoClient } from 'mongodb';
import { getConnection } from '../db/connections';

export class SearchAPI {
  constructor(config) {
    this.config = {
      dbUri: config.dbUri || process.env.MONGODB_URI,
      dbName: config.dbName || 'docs_search',
      collection: config.collection || 'search_index',
      ...config
    };
  }

  async initialize() {
    try {
      this.client = await getConnection(this.config.dbUri);
      this.db = this.client.db(this.config.dbName);
      this.collection = this.db.collection(this.config.collection);
      
      // Create text index for full-text search
      await this.collection.createIndex({
        title: 'text',
        description: 'text',
        keywords: 'text'
      });
    } catch (error) {
      throw new Error(`Failed to initialize search API: ${error.message}`);
    }
  }

  async search(query, options = {}) {
    const {
      limit = 10,
      skip = 0,
      sort = { score: { $meta: 'textScore' } }
    } = options;

    try {
      const results = await this.collection
        .find(
          {
            $text: {
              $search: query,
              $caseSensitive: false,
              $diacriticSensitive: false
            }
          },
          {
            score: { $meta: 'textScore' }
          }
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      return results;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async upsertDocument(document) {
    try {
      const result = await this.collection.updateOne(
        { id: document.id },
        { $set: document },
        { upsert: true }
      );
      return result;
    } catch (error) {
      throw new Error(`Failed to upsert document: ${error.message}`);
    }
  }

  async bulkUpsert(documents) {
    try {
      const operations = documents.map(doc => ({
        updateOne: {
          filter: { id: doc.id },
          update: { $set: doc },
          upsert: true
        }
      }));

      const result = await this.collection.bulkWrite(operations);
      return result;
    } catch (error) {
      throw new Error(`Bulk upsert failed: ${error.message}`);
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

export default SearchAPI;