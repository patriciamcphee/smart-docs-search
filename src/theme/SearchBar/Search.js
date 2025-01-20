// src/theme/SearchBar/Search.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import Fuse from 'fuse.js';
import styles from './styles.module.css';

// Enhanced search configuration
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 2,
  keys: [
    // Document-level searches
    { name: 'keywords', weight: 0.7 },
    { name: 'title', weight: 0.5 },
    { name: 'description', weight: 0.3 },
    // Section-level searches
    { name: 'sections.heading', weight: 0.6 },
    { name: 'sections.content', weight: 0.4 }
  ]
};

const Search = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [fuse, setFuse] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const history = useHistory();

  // Initialize search index and Fuse instance
  useEffect(() => {
    async function initializeSearch() {
      try {
        const response = await fetch('/searchIndex.json');
        if (!response.ok) throw new Error('Failed to load search index');
        const data = await response.json();

        // Process search index data
        const processedData = data.map(item => ({
          ...item,
          keywords: Array.isArray(item.keywords)
            ? item.keywords
                .map(k => k?.toLowerCase()?.trim())
                .filter(Boolean)
            : []
        }));

        setSearchIndex(processedData);
        setFuse(new Fuse(processedData, fuseOptions));
      } catch (error) {
        console.error('Error initializing search:', error);
      }
    }

    if (ExecutionEnvironment.canUseDOM) {
      initializeSearch();
    }
  }, []);

  // Handle clicks outside search component
  useEffect(() => {
    function handleClickOutside(event) {
      if (event.target.closest('.navbar__items--right')) return;
      
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          !event.target.closest('.navbar-search-container')) {
        setIsExpanded(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced search function
  const performSearch = useCallback((value) => {
    if (!value?.trim() || !fuse) {
      setSearchResults([]);
      return;
    }

    try {
      const results = fuse.search(value.trim());
      
      // Process and combine document and section matches
      const processedResults = results
        .reduce((acc, result) => {
          const { item, score, matches } = result;
          
          // Check for document-level matches
          const documentMatch = matches.some(match => 
            !match.path.includes('sections'));
          
          // Find matching sections
          const sectionMatches = matches
            .filter(match => match.path.includes('sections'))
            .map(match => {
              const sectionIndex = parseInt(match.path[1]);
              return item.sections[sectionIndex];
            });
          
          // Add document if it matched
          if (documentMatch) {
            acc.push({
              type: 'document',
              ...item,
              score
            });
          }
          
          // Add matching sections
          sectionMatches.forEach(section => {
            acc.push({
              type: 'section',
              parentTitle: item.title,
              parentUrl: item.url,
              ...section,
              score
            });
          });
          
          return acc;
        }, [])
        // Remove duplicates and sort by relevance
        .filter((result, index, self) => 
          index === self.findIndex(r => 
            r.type === result.type && 
            r.url === result.url
          )
        )
        .sort((a, b) => a.score - b.score)
        .slice(0, 10); // Show top 10 results

      setSearchResults(processedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [fuse]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  }, [performSearch]);

  const navigateToPage = (url) => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    history.replace(url.startsWith('/') ? url : `/${url}`);
  };

  const formatDate = (lastUpdate) => {
    if (!lastUpdate) return null;
    try {
      const dateStr = typeof lastUpdate === 'string' 
        ? lastUpdate 
        : lastUpdate.date || lastUpdate.lastUpdatedAt;
      
      if (!dateStr) return null;
  
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        author: typeof lastUpdate === 'object' ? lastUpdate.author : null
      };
    } catch (error) {
      return null;
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.searchWrapper} navbar-search-container ${isExpanded ? styles.expanded : ''}`}>
        <SearchOutlined 
          className={styles.searchIcon}
          onClick={(e) => {
            e.preventDefault();
            if (isExpanded && !searchTerm) {
              setIsExpanded(false);
              inputRef.current?.blur();
            } else {
              setIsExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
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
            {searchResults.length === 0 ? 'No results found' : 
             `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
          </div>
          {searchResults.map((item, index) => (
            <div
              key={`${item.type}-${item.url}-${index}`}
              className={`${styles.resultItem} ${
                item.type === 'section' ? styles.sectionResult : ''
              }`}
              onClick={() => navigateToPage(item.url)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateToPage(item.url);
                }
              }}
              tabIndex={0}
              role="button"
            >
              {item.type === 'document' ? (
                // Document result display
                <>
                  <div className={styles.resultTitle}>{item.title}</div>
                  <div className={styles.resultDescription}>
                    {item.description}
                  </div>
                  {item.last_update && (
                    <div className={styles.resultMeta}>
                      {formatDate(item.last_update)?.date && 
                        `Last updated: ${formatDate(item.last_update).date}`}
                    </div>
                  )}
                </>
              ) : (
                // Section result display
                <>
                  <div className={styles.resultParent}>
                    {item.parentTitle}
                  </div>
                  <div className={styles.resultTitle}>
                    <span className={styles.sectionMarker}>§</span>
                    {item.heading}
                  </div>
                  <div className={styles.resultDescription}>
                    {item.content}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;