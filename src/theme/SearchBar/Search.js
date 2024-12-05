import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import _ from 'lodash';
// Import from our local api.js in the same directory
import { initializeSearch, performSearch } from './api';
import styles from './styles.module.css';

const Search = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const history = useHistory();

  // Initialize the search index when component mounts
  useEffect(() => {
    initializeSearch().catch(error => {
      console.error('Failed to initialize search:', error);
    });
  }, []);

  // Modified search function to use Lunr instead of API
  const handleSearch = useCallback(
    _.debounce(async (value) => {
      if (!value?.trim()) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Use our new performSearch function from api.js
        const results = await performSearch(value.trim());
        setSearchResults(results.results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  return (
    <div className={styles.searchContainer}>
      <div 
        className={`${styles.searchWrapper} navbar-search-container ${
          isExpanded ? styles.expanded : ''
        }`}
      >
        <SearchOutlined 
          className={styles.searchIcon}
          onClick={handleSearchIconClick}
        />
        <Input
          ref={inputRef}
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={`${styles.searchInput} ${isExpanded ? styles.visible : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults.length > 0) {
              navigateToPage(searchResults[0].url);
            } else if (e.key === 'Escape') {
              setIsExpanded(false);
              setSearchTerm('');
              setSearchResults([]);
            }
          }}
        />
      </div>
      
      {isExpanded && searchTerm && (
        <div className={styles.dropdownResults} ref={dropdownRef}>
          <div className={styles.resultCount}>
            {isLoading ? 'Searching...' : 
              searchResults.length === 0 ? 'No results found' : 
              `Found ${searchResults.length} result${
                searchResults.length === 1 ? '' : 's'
              }`}
          </div>
          {searchResults.map((item) => (
            <div
              key={item.id}
              className={styles.resultItem}
              onClick={() => navigateToPage(item.url)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateToPage(item.url);
                }
              }}
              tabIndex={0}
              role="button"
            >
              <div className={styles.resultTitle}>{item.title}</div>
              <div className={styles.resultDescription}>{item.description}</div>
              {item.last_update && (
                <div className={styles.resultMeta}>
                  {formatDate(item.last_update)?.date && 
                    `Last updated: ${formatDate(item.last_update).date}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;