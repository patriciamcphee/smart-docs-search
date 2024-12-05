// src/components/Search/api.js
import lunr from 'lunr';

let searchIndex = null;
let documents = null;

export const initializeSearch = async () => {
  if (searchIndex) return; // Already initialized

  try {
    // Fetch the search index
    const response = await fetch('/searchIndex.json');
    if (!response.ok) throw new Error('Failed to load search index');
    
    documents = await response.json();
    
    // Create the Lunr index
    searchIndex = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('description', { boost: 5 });
      this.field('keywords', { boost: 3 });
      
      // Add documents to the index
      documents.forEach(doc => {
        this.add({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          keywords: doc.keywords?.join(' ') || '',
        });
      });
    });
  } catch (error) {
    console.error('Error initializing search:', error);
    throw error;
  }
};

export const performSearch = async (query) => {
  if (!searchIndex) {
    await initializeSearch();
  }

  try {
    const results = searchIndex.search(query).map(result => {
      const document = documents.find(doc => doc.id === result.ref);
      return {
        ...document,
        score: result.score,
      };
    });

    return {
      results: results.sort((a, b) => b.score - a.score),
    };
  } catch (error) {
    console.error('Search error:', error);
    return { results: [] };
  }
};