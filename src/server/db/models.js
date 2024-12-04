// src/server/db/models.js
export class SearchIndexModel {
  constructor(db) {
    this.collection = db.collection('search_index');
  }

  async createIndexes() {
    await this.collection.createIndex({
      title: 'text',
      description: 'text',
      keywords: 'text'
    });
    await this.collection.createIndex({ id: 1 }, { unique: true });
    await this.collection.createIndex({ version: 1 });
  }

  async upsertDocument(document) {
    return this.collection.updateOne(
      { id: document.id, version: document.version },
      { $set: document },
      { upsert: true }
    );
  }

  async bulkUpsert(documents) {
    const operations = documents.map(doc => ({
      updateOne: {
        filter: { id: doc.id, version: doc.version },
        update: { $set: doc },
        upsert: true
      }
    }));
    return this.collection.bulkWrite(operations);
  }

  async search(query, version = null, options = {}) {
    const { limit = 10, skip = 0 } = options;
    const filter = {
      $text: { $search: query }
    };

    if (version) {
      filter.version = version;
    }

    return this.collection
      .find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}