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

        const response = await fetch('/searchIndex.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('Search index is empty or invalid');
          return;
        }

        const fuseOptions = {
          includeScore: true,
          threshold: 0.3,            // Lower threshold for more matches
          ignoreLocation: true,      // Search entire string
          distance: 100,             // How far to look for matches
          minMatchCharLength: 2,     // Minimum chars that must match
          useExtendedSearch: false,  // Stick to standard fuzzy search
          findAllMatches: true,      // Find all possible matches
          keys: [
            { name: 'title', weight: 1.0 },
            { name: 'sections.heading', weight: 1.0 },
            { name: 'keywords', weight: 0.8 },
            { name: 'description', weight: 0.6 },
            { name: 'sections.content', weight: 0.5 },
            { name: 'content', weight: 0.4 }
          ]
        };

        const fuseInstance = new Fuse(data, fuseOptions);
        setSearchIndex(data);
        setFuse(fuseInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing search:', error);
        setError(error);
        setIsLoading(false);
      }
    }

    if (ExecutionEnvironment.canUseDOM) {
      initializeSearch();
    }
  }, []);

  // Process and organize search results
  const performSearch = useCallback((term) => {
    if (!term?.trim() || !fuse) {
      setSearchResults([]);
      return;
    }
  
    try {
      const searchTerm = term.trim().toLowerCase();
      const results = fuse.search(searchTerm);
      
      // Create a map to group sections by their parent document
      const documentMap = new Map();
      
      results.forEach(result => {
        const item = result.item;
        const itemScore = result.score;
        
        // Create document entry if it doesn't exist
        if (!documentMap.has(item.url)) {
          documentMap.set(item.url, {
            type: 'document',
            title: item.title,
            url: item.url,
            previewContent: item.description || item.content?.slice(0, 150),
            last_update: item.last_update,
            score: itemScore,
            sections: [] // Array to hold matching sections
          });
        }
  
        // Process sections and add them to their parent document
        if (item.sections) {
          item.sections.forEach(section => {
            const sectionUrl = `${item.url}#${section.id}`;
            
            // Simple matching that leverages Fuse.js's built-in fuzzy search
            const sectionFuse = new Fuse([section], {
              threshold: 0.3,
              keys: ['heading', 'content']
            });
            
            const sectionMatches = sectionFuse.search(searchTerm);
            
            if (sectionMatches.length > 0) {
              const parentDoc = documentMap.get(item.url);
              // Only add section if it's not already included
              if (!parentDoc.sections.some(s => s.url === sectionUrl)) {
                parentDoc.sections.push({
                  type: 'section',
                  parentTitle: item.title,
                  parentUrl: item.url,
                  heading: section.heading,
                  url: sectionUrl,
                  previewContent: '', // No content preview for sections
                  score: itemScore + 0.1
                });
              }
            }
          });
        }
      });
  
      // Convert map to array and sort documents by score
      const processedResults = Array.from(documentMap.values())
        .sort((a, b) => a.score - b.score)
        .reduce((acc, doc) => {
          // Add the document
          // Add the document with search term for highlighting
          acc.push({
            ...doc,
            searchTerm
          });
          // Add its sections with search term for highlighting
          if (doc.sections.length > 0) {
            acc.push(...doc.sections.map(section => ({
              ...section,
              searchTerm
            })).sort((a, b) => a.score - b.score));
          }
          return acc;
        }, []);
  
      setSearchResults(processedResults);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [fuse]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
    setIsExpanded(true);
  }, [performSearch]);

  // Handle navigation
  const navigateToPage = useCallback((url) => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    history.push(formattedUrl);
  }, [history]);

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
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsExpanded(false);
        setSearchTerm('');
        setSearchResults([]);
        break;
    }
  }, [searchResults, selectedIndex, navigateToPage]);

  // Utility function to highlight text matches
const highlightText = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/);
  
  // Create a regex pattern that matches any of the search terms
  const pattern = new RegExp(`(${searchTerms.map(term => 
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|')})`, 'gi');

  // Split the text into parts that should and shouldn't be highlighted
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    if (searchTerms.some(term => part.toLowerCase() === term)) {
      return <mark key={i} className={styles.highlighted}>{part}</mark>;
    }
    return part;
  });
};

  // Render an individual search result
  const renderSearchResult = (result, index) => {
    const isSelected = index === selectedIndex;
    
    return (
      <div
        ref={el => resultRefs.current[index] = el}
        key={`${result.type}-${result.url}-${index}`}
        className={`${styles.resultItem} ${
          result.type === 'section' ? styles.sectionResult : ''
        } ${isSelected ? styles.selected : ''}`}
        onClick={() => navigateToPage(result.url)}
        onMouseEnter={() => setSelectedIndex(index)}
        tabIndex={0}
        role="button"
        aria-selected={isSelected}
      >
        {result.type === 'document' ? (
          <>
            <div className={styles.resultTitle}>
              {highlightText(result.title, result.searchTerm)}
            </div>
            {result.previewContent && (
              <div className={styles.resultDescription}>
                {highlightText(result.previewContent, result.searchTerm)}
              </div>
            )}
            {result.last_update && (
              <div className={styles.resultMeta}>
                {formatDate(result.last_update)?.date && 
                  `Last updated: ${formatDate(result.last_update).date}`}
                {formatDate(result.last_update)?.author && 
                  ` by ${formatDate(result.last_update).author}`}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.resultTitle}>
              <span className={styles.sectionMarker}>§</span>
              {highlightText(result.heading, result.searchTerm)}
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
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
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