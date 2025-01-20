import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import Fuse from 'fuse.js';
import styles from './styles.module.css';

// Helper function to format dates consistently
const formatDate = (lastUpdate) => {
  if (!lastUpdate) return null;
  
  try {
    const dateStr = typeof lastUpdate === 'string' 
      ? lastUpdate 
      : lastUpdate.date || lastUpdate.lastUpdatedAt;
    
    if (!dateStr) return null;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      author: typeof lastUpdate === 'object' ? lastUpdate.author : null
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

const Search = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const resultRefs = useRef([]);
  const history = useHistory();

  // Initialize search index and Fuse instance
  useEffect(() => {
    async function initializeSearch() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Search Component: Initializing search...');

        const response = await fetch('/searchIndex.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Search Component: Loaded search index:', data);

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('Search Component: Search index is empty or invalid');
          return;
        }

        // Configure Fuse options
        const fuseOptions = {
          includeScore: true,
          threshold: 0.4,
          ignoreLocation: true,
          useExtendedSearch: true,
          keys: [
            { 
              name: 'title', 
              weight: 1.0 
            },
            { 
              name: 'sections.heading', 
              weight: 1.0 
            },
            {
              name: 'keywords',
              weight: 0.8
            },
            { 
              name: 'description', 
              weight: 0.6 
            },
            { 
              name: 'sections.content', 
              weight: 0.5 
            },
            { 
              name: 'content', 
              weight: 0.4 
            }
          ]
        };

        console.log('Search Component: Initializing Fuse with options:', fuseOptions);
        const fuseInstance = new Fuse(data, fuseOptions);
        
        setSearchIndex(data);
        setFuse(fuseInstance);
        setIsLoading(false);

        // Perform a test search
        const testResults = fuseInstance.search('test');
        console.log('Search Component: Test search results:', testResults);

      } catch (error) {
        console.error('Search Component: Error initializing search:', error);
        setError(error);
        setIsLoading(false);
      }
    }

    if (ExecutionEnvironment.canUseDOM) {
      initializeSearch();
    }
  }, []);

  const performSearch = useCallback((term) => {
    if (!term?.trim() || !fuse) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('Search Component: Performing search for:', term);
      
      // Perform the search
      const results = fuse.search(term);
      console.log('Search Component: Raw search results:', results);

      // Process results and include sections
      const processedResults = [];
      
      results
        .filter(result => result.score <= 0.4) // Keep only good matches
        .forEach(result => {
          const item = result.item;
          
          // Add the main document result
          processedResults.push({
            type: 'document',
            title: item.title,
            url: item.url,
            previewContent: item.description || item.content?.slice(0, 150) || '',
            last_update: item.last_update,
            score: result.score
          });

          // Add matching sections
          if (item.sections && Array.isArray(item.sections)) {
            const sectionMatches = item.sections.filter(section => {
              const searchTermLower = term.toLowerCase();
              return (
                section.heading?.toLowerCase().includes(searchTermLower) ||
                section.content?.toLowerCase().includes(searchTermLower)
              );
            });

            sectionMatches.forEach(section => {
              processedResults.push({
                type: 'section',
                parentTitle: item.title,
                heading: section.heading,
                url: section.url || `${item.url}#${section.id}`,
                previewContent: section.content?.slice(0, 150) || '',
                score: result.score + 0.1 // Slightly lower priority than parent document
              });
            });
          }
        });

      // Sort by score
      processedResults.sort((a, b) => a.score - b.score);

      console.log('Search Component: Processed results:', processedResults);
      setSearchResults(processedResults);
      
    } catch (error) {
      console.error('Search Component: Error during search:', error);
      setSearchResults([]);
    }
  }, [fuse]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  }, [performSearch]);

  // Handle navigation to search result
  const navigateToPage = useCallback((url) => {
    closeSearch();
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    history.replace(formattedUrl);
  }, [history]);

  // Close search and reset state
  const closeSearch = useCallback(() => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          navigateToPage(searchResults[selectedIndex].url);
        } else if (searchResults.length > 0) {
          navigateToPage(searchResults[0].url);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        closeSearch();
        break;
    }
  }, [searchResults, selectedIndex, navigateToPage, closeSearch]);

  // Render an individual search result
  const renderSearchResult = (item, index) => {
    const isSelected = index === selectedIndex;
    
    return (
      <div
        ref={el => resultRefs.current[index] = el}
        key={`${item.type}-${item.url}-${index}`}
        className={`${styles.resultItem} ${
          item.type === 'section' ? styles.sectionResult : ''
        } ${isSelected ? styles.selected : ''}`}
        onClick={() => navigateToPage(item.url)}
        onMouseEnter={() => setSelectedIndex(index)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            navigateToPage(item.url);
          }
        }}
        tabIndex={0}
        role="button"
        aria-selected={isSelected}
      >
        {item.type === 'document' ? (
          <>
            <div className={styles.resultTitle}>{item.title}</div>
            <div className={styles.resultDescription}>
              {item.previewContent}
            </div>
            {item.last_update && (
              <div className={styles.resultMeta}>
                {formatDate(item.last_update)?.date && 
                  `Last updated: ${formatDate(item.last_update).date}`}
                {formatDate(item.last_update)?.author && 
                  ` by ${formatDate(item.last_update).author}`}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.resultParent}>
              {item.parentTitle}
            </div>
            <div className={styles.resultTitle}>
              <span className={styles.sectionMarker}>§</span>
              {item.heading}
            </div>
            <div className={styles.resultDescription}>
              {item.previewContent}
            </div>
          </>
        )}
      </div>
    );
  };

  // Scroll selected result into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultRefs.current[selectedIndex]) {
      resultRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.searchWrapper} navbar-search-container ${isExpanded ? styles.expanded : ''}`}>
        <SearchOutlined 
          className={styles.searchIcon}
          onClick={(e) => {
            e.preventDefault();
            if (isExpanded && !searchTerm) {
              closeSearch();
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
          onKeyDown={handleKeyDown}
          className={`${styles.searchInput} ${isExpanded ? styles.visible : ''}`}
          aria-expanded={isExpanded}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </div>
      
      {isExpanded && searchTerm && (
        <div 
          id="search-results"
          className={styles.dropdownResults} 
          ref={dropdownRef}
          role="listbox"
        >
          <div className={styles.resultCount}>
            {searchResults.length === 0 ? 'No results found' : 
             `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
          </div>
          {searchResults.map((item, index) => renderSearchResult(item, index))}
        </div>
      )}
    </div>
  );
};

export default Search;