// src/theme/SearchBar/Search.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import lunr from 'lunr';
import styles from './styles.module.css';

const Search = () => {
  // State definitions
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs and hooks
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const history = useHistory();

  // Function to format dates consistently
  const formatDate = (lastUpdate) => {
    if (!lastUpdate) return null;
    try {
      const dateStr = typeof lastUpdate === 'string' 
        ? lastUpdate 
        : lastUpdate.date || lastUpdate.lastUpdatedAt;
      
      if (!dateStr) return null;
  
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  // Function to handle search icon click
  const handleSearchIconClick = (e) => {
    e.preventDefault();
    if (isExpanded && !searchTerm) {
      setIsExpanded(false);
      inputRef.current?.blur();
    } else {
      setIsExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Function to handle search input changes
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    performSearch(value);
  };

  // Function to handle navigation
  const navigateToPage = (url) => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    history.push(url);
  };

  // Search functionality
  const performSearch = useCallback(async (value) => {
    if (!value?.trim() || !searchIndex) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = searchIndex.search(value.trim()).map(result => {
        const document = documents.find(doc => doc.id === result.ref);
        return {
          ...document,
          score: result.score,
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchIndex, documents]);

  // Initialize search index
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        const response = await fetch('/searchIndex.json');
        if (!response.ok) throw new Error('Failed to load search index');
        const docs = await response.json();
        setDocuments(docs);

        const idx = lunr(function () {
          this.ref('id');
          this.field('title', { boost: 10 });
          this.field('description', { boost: 5 });
          this.field('keywords', { boost: 3 });

          docs.forEach(doc => {
            this.add({
              id: doc.id,
              title: doc.title || '',
              description: doc.description || '',
              keywords: Array.isArray(doc.keywords) ? doc.keywords.join(' ') : '',
            });
          });
        });

        setSearchIndex(idx);
      } catch (error) {
        console.error('Error initializing search:', error);
      }
    };

    if (ExecutionEnvironment.canUseDOM) {
      initializeSearch();
    }

    // Handle clicks outside search component
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !event.target.closest('.navbar-search-container')) {
        setIsExpanded(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Component render
  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.searchWrapper} navbar-search-container ${isExpanded ? styles.expanded : ''}`}>
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
          {isLoading ? (
            <div className={styles.resultCount}>Searching...</div>
          ) : (
            <>
              <div className={styles.resultCount}>
                {searchResults.length === 0 ? 'No results found' : 
                 `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
              </div>
              {searchResults.map((result) => {
                const lastUpdate = formatDate(result.last_update);
                return (
                  <div
                    key={result.id}
                    className={styles.resultItem}
                    onClick={() => navigateToPage(result.url)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigateToPage(result.url);
                      }
                    }}
                  >
                    <div className={styles.resultTitle}>{result.title}</div>
                    {result.description && (
                      <div className={styles.resultDescription}>
                        {result.description}
                      </div>
                    )}
                    {lastUpdate && (
                      <div className={styles.resultMeta}>
                        Last updated: {lastUpdate}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;