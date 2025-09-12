/**
 * Copyright (c) Patricia McPhee.
 *
 * This source code is licensed under the MIT license.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Tooltip } from 'antd';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
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
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const resultRefs = useRef([]);
  const history = useHistory();

  // Try to get search data from plugin
  const pluginData = usePluginData('smart-search-plugin');
  const { searchIndex: pluginSearchIndex, searchWeights } = pluginData || {};

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleSearchClose();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  // Escape key handler
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isExpanded) {
        handleSearchClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isExpanded]);

  // Initialize search index and Fuse instance
  useEffect(() => {
    async function initializeSearch() {
      try {
        setIsLoading(true);
        setError(null);

        let searchData = pluginSearchIndex;

        // Fallback to fetching from static file if plugin data not available
        if (!searchData || searchData.length === 0) {
          const response = await fetch('/searchIndex.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          searchData = await response.json();
        }

        if (!Array.isArray(searchData) || searchData.length === 0) {
          console.warn('[Smart Search]: Search index is empty or invalid');
          setIsLoading(false);
          return;
        }

        const weights = searchWeights || {
          title: 1.0,
          'sections.heading': 1.0,
          keywords: 0.8,
          description: 0.6,
          'sections.content': 0.5,
          content: 0.4
        };

        const fuseOptions = {
          includeScore: true,
          threshold: 0.3,
          ignoreLocation: true,
          distance: 100,
          minMatchCharLength: 2,
          useExtendedSearch: false,
          findAllMatches: true,
          keys: Object.entries(weights).map(([name, weight]) => ({ name, weight }))
        };

        const fuseInstance = new Fuse(searchData, fuseOptions);
        setFuse(fuseInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('[Smart Search]: Error initializing search:', error);
        setError(error);
        setIsLoading(false);
      }
    }

    if (ExecutionEnvironment.canUseDOM) {
      initializeSearch();
    }
  }, [pluginSearchIndex, searchWeights]);

  // Process and organize search results
  const performSearch = useCallback((term) => {
    if (!term?.trim() || !fuse) {
      setSearchResults([]);
      return;
    }
  
    try {
      const searchTerm = term.trim().toLowerCase();
      const results = fuse.search(searchTerm);
      
      const documentMap = new Map();
      
      results.forEach(result => {
        const item = result.item;
        const itemScore = result.score;
        
        if (!documentMap.has(item.url)) {
          documentMap.set(item.url, {
            type: 'document',
            title: item.title,
            url: item.url,
            previewContent: item.description || item.content?.slice(0, 150),
            last_update: item.last_update,
            score: itemScore,
            sections: []
          });
        }
  
        if (item.sections) {
          item.sections.forEach(section => {
            const sectionUrl = `${item.url}#${section.id}`;
            
            const sectionFuse = new Fuse([section], {
              threshold: 0.3,
              keys: ['heading', 'content']
            });
            
            const sectionMatches = sectionFuse.search(searchTerm);
            
            if (sectionMatches.length > 0) {
              const parentDoc = documentMap.get(item.url);
              if (!parentDoc.sections.some(s => s.url === sectionUrl)) {
                parentDoc.sections.push({
                  type: 'section',
                  parentTitle: item.title,
                  parentUrl: item.url,
                  heading: section.heading,
                  url: sectionUrl,
                  previewContent: '',
                  score: itemScore + 0.1
                });
              }
            }
          });
        }
      });
  
      const processedResults = Array.from(documentMap.values())
        .sort((a, b) => a.score - b.score)
        .reduce((acc, doc) => {
          acc.push({
            ...doc,
            searchTerm
          });
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
      console.error('[Smart Search]: Search error:', error);
      setSearchResults([]);
    }
  }, [fuse]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
    setIsExpanded(true);
    setSelectedIndex(-1);
  }, [performSearch]);

  // Handle clear search
  const handleClearSearch = useCallback((e) => {
    e.stopPropagation();
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Handle search close
  const handleSearchClose = useCallback(() => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, []);

  // Handle navigation
  const navigateToPage = useCallback((url) => {
    handleSearchClose();
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    history.push(formattedUrl);
  }, [history, handleSearchClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isExpanded) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.length > 0 && selectedIndex >= 0) {
          navigateToPage(searchResults[selectedIndex].url);
        } else if (searchResults.length > 0) {
          navigateToPage(searchResults[0].url);
        }
        break;
      case 'Tab':
        const newIndex = e.shiftKey ? 
          Math.max(-1, selectedIndex - 1) : 
          Math.min(searchResults.length - 1, selectedIndex + 1);
        setSelectedIndex(newIndex);
        break;
      case 'Escape':
        e.preventDefault();
        handleSearchClose();
        break;
    }
  }, [searchResults, selectedIndex, navigateToPage, handleSearchClose, isExpanded]);

  // Handle result focus
  const handleResultFocus = useCallback((index) => {
    setSelectedIndex(index);
    setIsFocused(true);
  }, []);

  const handleResultBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Highlight text matches - React.createElement version
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/);
    
    const pattern = new RegExp(`(${searchTerms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, i) => {
      if (searchTerms.some(term => part.toLowerCase() === term)) {
        return React.createElement('mark', {
          key: i,
          className: styles.highlighted
        }, part);
      }
      return part;
    });
  };

  // Render search result - React.createElement version
  const renderSearchResult = (result, index) => {
    const isSelected = index === selectedIndex;
    
    return React.createElement('div', {
      ref: el => resultRefs.current[index] = el,
      key: `${result.type}-${result.url}-${index}`,
      className: `${styles.resultItem} ${
        result.type === 'section' ? styles.sectionResult : ''
      } ${isSelected ? styles.selected : ''}`,
      onClick: () => navigateToPage(result.url),
      onMouseEnter: () => setSelectedIndex(index),
      onFocus: () => handleResultFocus(index),
      onBlur: handleResultBlur,
      onKeyDown: (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          navigateToPage(result.url);
        }
      },
      tabIndex: 0,
      role: 'option',
      'aria-selected': isSelected
    },
      result.type === 'document' ? [
        React.createElement('div', {
          key: 'title',
          className: styles.resultTitle
        }, highlightText(result.title, result.searchTerm)),
        result.previewContent && React.createElement('div', {
          key: 'desc',
          className: styles.resultDescription
        }, highlightText(result.previewContent, result.searchTerm)),
        result.last_update && React.createElement('div', {
          key: 'meta',
          className: styles.resultMeta
        }, formatDate(result.last_update)?.date && 
          `Last updated: ${formatDate(result.last_update).date}`)
      ] : [
        React.createElement('div', {
          key: 'section-title',
          className: styles.resultTitle
        }, [
          React.createElement('span', {
            key: 'marker',
            className: styles.sectionMarker
          }, '§'),
          highlightText(result.heading, result.searchTerm)
        ])
      ]
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

  const toggleSearch = useCallback(() => {
    if (isExpanded) {
      handleSearchClose();
    } else {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded, handleSearchClose]);

  // Main render - React.createElement version
  return React.createElement('div', {
    className: styles.searchContainer,
    ref: containerRef
  }, [
    React.createElement('div', {
      key: 'wrapper',
      className: `${styles.searchWrapper} ${isExpanded ? styles.expanded : ''}`
    }, [
      isExpanded ? 
        React.createElement(Tooltip, {
          key: 'tooltip',
          title: 'Click to close',
          placement: 'bottom',
          mouseEnterDelay: 0.5,
          overlayClassName: styles.searchTooltip,
          overlayInnerStyle: { paddingTop: '10px' },
          align: { offset: [0, 15] }
        }, 
          React.createElement(SearchOutlined, {
            className: styles.searchIcon,
            onClick: toggleSearch
          })
        ) :
        React.createElement(SearchOutlined, {
          key: 'icon',
          className: styles.searchIcon,
          onClick: toggleSearch
        }),
      React.createElement('div', {
        key: 'input-wrapper',
        className: styles.searchInputWrapper
      },
        React.createElement(Input, {
          ref: inputRef,
          placeholder: 'Search documentation...',
          value: searchTerm,
          onChange: handleSearchChange,
          onKeyDown: handleKeyDown,
          className: `${styles.searchInput} ${isExpanded ? styles.visible : ''}`,
          'aria-expanded': isExpanded,
          'aria-controls': 'search-results',
          'aria-autocomplete': 'list',
          suffix: React.createElement(CloseCircleFilled, {
            className: `${styles.clearButton} ${searchTerm ? styles.clearButtonVisible : ''}`,
            onClick: handleClearSearch,
            'aria-label': 'Clear search',
            tabIndex: searchTerm ? 0 : -1,
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClearSearch(e);
              }
            }
          })
        })
      )
    ]),
    isExpanded && searchTerm && React.createElement('div', {
      key: 'results',
      id: 'search-results',
      className: styles.dropdownResults,
      ref: dropdownRef,
      role: 'listbox',
      tabIndex: '-1',
      'aria-activedescendant': selectedIndex >= 0 ? `result-${selectedIndex}` : undefined
    }, [
      React.createElement('div', {
        key: 'count',
        className: styles.resultCount
      }, searchResults.length === 0 ? 'No results found' : 
         `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`),
      ...searchResults.map((item, index) => renderSearchResult(item, index))
    ])
  ]);
};

export default Search;