// src/client/hooks/useSearch.js
import { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';

const DEFAULT_FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 2,
  keys: [
    { name: 'keywords', weight: 0.7 },
    { name: 'title', weight: 0.5 },
    { name: 'description', weight: 0.3 }
  ]
};

export const useSearch = ({
  indexPath = '/searchIndex.json',
  apiEndpoint = null,
  fuseOptions = DEFAULT_FUSE_OPTIONS,
  debounceMs = 300
}) => {
  const [searchIndex, setSearchIndex] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Initialize search engine
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        if (!apiEndpoint) {
          // Local search using Fuse.js
          const response = await fetch(indexPath);
          if (!response.ok) throw new Error('Failed to load search index');
          const data = await response.json();
          
          const processedData = data.map(item => ({
            ...item,
            keywords: Array.isArray(item.keywords)
              ? item.keywords.map(k => k?.toLowerCase()?.trim()).filter(Boolean)
              : [],
          }));
        
          setSearchIndex(processedData);
          setFuse(new Fuse(processedData, fuseOptions));
        }
      } catch (error) {
        setError(error.message);
      }
    };

    initializeSearch();
  }, [indexPath, apiEndpoint, fuseOptions]);

  // Debounced search function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm?.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (apiEndpoint) {
        // API-based search
        const response = await fetch(`${apiEndpoint}?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search request failed');
        const results = await response.json();
        setSearchResults(results);
      } else if (fuse) {
        // Local search using Fuse.js
        const results = fuse.search(searchTerm.trim());
        const processedResults = Array.from(
          new Map(results.map(result => [result.item.id, result.item])).values()
        );
        setSearchResults(processedResults);
      }
    } catch (error) {
      setError(error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, fuse]);

  const debouncedSearch = useCallback(
    debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  );

  return {
    search: debouncedSearch,
    results: searchResults,
    isLoading,
    error,
    searchIndex
  };
};

export default useSearch;