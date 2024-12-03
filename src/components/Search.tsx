// src/components/Search.tsx
import React, { useState, useEffect } from 'react';
import { SearchClient } from '../utils/searchClient';
import type { SearchResult, SearchOptions } from '../types';

interface SearchProps extends SearchOptions {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export const Search: React.FC<SearchProps> = ({
  placeholder = 'Search documentation...',
  className = '',
  onResultClick,
  ...searchOptions
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [client, setClient] = useState<SearchClient | null>(null);

  useEffect(() => {
    const initializeSearch = async () => {
      const searchClient = new SearchClient(searchOptions);
      await searchClient.initialize();
      setClient(searchClient);
    };

    initializeSearch();
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim() || !client) {
      setResults([]);
      return;
    }

    const searchResults = client.search(value);
    setResults(searchResults);
  };

  return (
    <div className={`search-container ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => onResultClick?.(result)}
            >
              <h4>{result.title}</h4>
              <p>{result.content.substring(0, 150)}...</p>
              <small>{result.url}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};