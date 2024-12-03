// src/client/components/SearchResults.js
import React, { forwardRef } from 'react';

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

const SearchResults = forwardRef(({
  isExpanded,
  searchTerm,
  results,
  isLoading,
  onResultClick,
  classNames = {}
}, ref) => {
  if (!isExpanded || !searchTerm) {
    return null;
  }

  return (
    <div 
      className={`search-dropdown ${classNames.dropdown || ''}`}
      ref={ref}
    >
      <div className={`search-result-count ${classNames.resultCount || ''}`}>
        {isLoading ? (
          'Searching...'
        ) : results.length === 0 ? (
          'No results found'
        ) : (
          `Found ${results.length} result${results.length === 1 ? '' : 's'}`
        )}
      </div>

      {results.map((item) => (
        <div
          key={item.id}
          className={`search-result-item ${classNames.resultItem || ''}`}
          onClick={() => onResultClick(item.url)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onResultClick(item.url);
            }
          }}
          tabIndex={0}
          role="button"
        >
          <div className={`search-result-title ${classNames.resultTitle || ''}`}>
            {item.title}
          </div>
          
          {item.description && (
            <div className={`search-result-description ${classNames.resultDescription || ''}`}>
              {item.description}
            </div>
          )}
          
          {item.last_update && formatDate(item.last_update)?.date && (
            <div className={`search-result-meta ${classNames.resultMeta || ''}`}>
              Last updated: {formatDate(item.last_update).date}
              {formatDate(item.last_update).author && 
                ` by ${formatDate(item.last_update).author}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

SearchResults.displayName = 'SearchResults';

export default SearchResults;