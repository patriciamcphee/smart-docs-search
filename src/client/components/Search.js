// src/client/components/Search.js
import React, { useState, useRef } from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchResults from './SearchResults';

const Search = ({
  onNavigate,
  CustomInput,
  CustomIcon,
  classNames = {},
  placeholder = 'Search documentation...',
  indexPath = '/searchIndex.json',
  apiEndpoint = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    search,
    results: searchResults,
    isLoading
  } = useSearch({
    indexPath,
    apiEndpoint,
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    search(value);
  };

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

  const handleResultClick = (url) => {
    setIsExpanded(false);
    setSearchTerm('');
    onNavigate?.(url);
  };

  // Default Input component if none provided
  const Input = CustomInput || (props => (
    <input
      type="text"
      {...props}
      className={`search-input ${props.className || ''}`}
    />
  ));

  // Default Icon component if none provided
  const SearchIcon = CustomIcon || (() => (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ));

  return (
    <div className={`search-container ${classNames.container || ''}`}>
      <div className={`search-wrapper ${isExpanded ? 'expanded' : ''} ${classNames.wrapper || ''}`}>
        <SearchIcon
          className={`search-icon ${classNames.icon || ''}`}
          onClick={handleSearchIconClick}
        />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          className={`${isExpanded ? 'visible' : ''} ${classNames.input || ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults.length > 0) {
              handleResultClick(searchResults[0].url);
            } else if (e.key === 'Escape') {
              setIsExpanded(false);
              setSearchTerm('');
            }
          }}
        />
      </div>

      <SearchResults
        isExpanded={isExpanded}
        searchTerm={searchTerm}
        results={searchResults}
        isLoading={isLoading}
        onResultClick={handleResultClick}
        ref={dropdownRef}
        classNames={classNames}
      />
    </div>
  );
};

export default Search;