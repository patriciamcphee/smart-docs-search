"use strict";

exports.__esModule = true;
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _antd = require("antd");
var _icons = require("@ant-design/icons");
var _router = require("@docusaurus/router");
var _ExecutionEnvironment = _interopRequireDefault(require("@docusaurus/ExecutionEnvironment"));
var _fuse = _interopRequireDefault(require("fuse.js"));
var _stylesModule = _interopRequireDefault(require("./styles.module.css"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// Helper function to format dates consistently
const formatDate = lastUpdate => {
  if (!lastUpdate) return null;
  try {
    const dateStr = typeof lastUpdate === 'string' ? lastUpdate : lastUpdate.date || lastUpdate.lastUpdatedAt;
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};
const Search = () => {
  const [isExpanded, setIsExpanded] = (0, _react.useState)(false);
  const [searchTerm, setSearchTerm] = (0, _react.useState)('');
  const [searchResults, setSearchResults] = (0, _react.useState)([]);
  const [searchIndex, setSearchIndex] = (0, _react.useState)([]);
  const [fuse, setFuse] = (0, _react.useState)(null);
  const [selectedIndex, setSelectedIndex] = (0, _react.useState)(-1);
  const [isLoading, setIsLoading] = (0, _react.useState)(true);
  const [error, setError] = (0, _react.useState)(null);
  const inputRef = (0, _react.useRef)(null);
  const dropdownRef = (0, _react.useRef)(null);
  const resultRefs = (0, _react.useRef)([]);
  const history = (0, _router.useHistory)();

  // Initialize search index and Fuse instance
  (0, _react.useEffect)(() => {
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
          threshold: 0.3,
          // Lower threshold for more matches
          ignoreLocation: true,
          // Search entire string
          distance: 100,
          // How far to look for matches
          minMatchCharLength: 2,
          // Minimum chars that must match
          useExtendedSearch: false,
          // Stick to standard fuzzy search
          findAllMatches: true,
          // Find all possible matches
          keys: [{
            name: 'title',
            weight: 1.0
          }, {
            name: 'sections.heading',
            weight: 1.0
          }, {
            name: 'keywords',
            weight: 0.8
          }, {
            name: 'description',
            weight: 0.6
          }, {
            name: 'sections.content',
            weight: 0.5
          }, {
            name: 'content',
            weight: 0.4
          }]
        };
        const fuseInstance = new _fuse.default(data, fuseOptions);
        setSearchIndex(data);
        setFuse(fuseInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing search:', error);
        setError(error);
        setIsLoading(false);
      }
    }
    if (_ExecutionEnvironment.default.canUseDOM) {
      initializeSearch();
    }
  }, []);

  // Process and organize search results
  const performSearch = (0, _react.useCallback)(term => {
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
            const sectionFuse = new _fuse.default([section], {
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
                  previewContent: '',
                  // No content preview for sections
                  score: itemScore + 0.1
                });
              }
            }
          });
        }
      });

      // Convert map to array and sort documents by score
      const processedResults = Array.from(documentMap.values()).sort((a, b) => a.score - b.score).reduce((acc, doc) => {
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
  const handleSearchChange = (0, _react.useCallback)(e => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
    setIsExpanded(true);
    setSelectedIndex(-1);
  }, [performSearch]);

  // Handle search close
  const handleSearchClose = (0, _react.useCallback)(() => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, []);

  // Handle navigation
  const navigateToPage = (0, _react.useCallback)(url => {
    handleSearchClose();
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    history.push(formattedUrl);
  }, [history, handleSearchClose]);

  // Handle keyboard navigation
  const handleKeyDown = (0, _react.useCallback)(e => {
    if (!isExpanded) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.length > 0) {
          if (selectedIndex === -1) {
            // If no item is selected, navigate to first result
            navigateToPage(searchResults[0].url);
          } else if (searchResults[selectedIndex]) {
            navigateToPage(searchResults[selectedIndex].url);
          }
        }
        break;
      case 'Tab':
        // Don't prevent default to allow normal tab behavior
        const newIndex = e.shiftKey ? Math.max(0, selectedIndex - 1) : Math.min(searchResults.length - 1, selectedIndex + 1);
        setSelectedIndex(newIndex);
        break;
      case 'Escape':
        e.preventDefault();
        handleSearchClose();
        break;
    }
  }, [searchResults, selectedIndex, navigateToPage, handleSearchClose, isExpanded]);

  // Utility function to highlight text matches
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/);

    // Create a regex pattern that matches any of the search terms
    const pattern = new RegExp(`(${searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

    // Split the text into parts that should and shouldn't be highlighted
    const parts = text.split(pattern);
    return parts.map((part, i) => {
      if (searchTerms.some(term => part.toLowerCase() === term)) {
        return /*#__PURE__*/_react.default.createElement("mark", {
          key: i,
          className: _stylesModule.default.highlighted
        }, part);
      }
      return part;
    });
  };

  // Render an individual search result
  const renderSearchResult = (result, index) => {
    const isSelected = index === selectedIndex;
    return /*#__PURE__*/_react.default.createElement("div", {
      ref: el => resultRefs.current[index] = el,
      key: `${result.type}-${result.url}-${index}`,
      className: `${_stylesModule.default.resultItem} ${result.type === 'section' ? _stylesModule.default.sectionResult : ''} ${isSelected ? _stylesModule.default.selected : ''}`,
      onClick: () => navigateToPage(result.url),
      onMouseEnter: () => setSelectedIndex(index),
      tabIndex: 0,
      role: "button",
      "aria-selected": isSelected
    }, result.type === 'document' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultTitle
    }, highlightText(result.title, result.searchTerm)), result.previewContent && /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultDescription
    }, highlightText(result.previewContent, result.searchTerm)), result.last_update && /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultMeta
    }, formatDate(result.last_update)?.date && `Last updated: ${formatDate(result.last_update).date}`, formatDate(result.last_update)?.author && ` by ${formatDate(result.last_update).author}`)) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultTitle
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: _stylesModule.default.sectionMarker
    }, "\xA7"), highlightText(result.heading, result.searchTerm))));
  };

  // Scroll selected result into view
  (0, _react.useEffect)(() => {
    if (selectedIndex >= 0 && resultRefs.current[selectedIndex]) {
      resultRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);
  const toggleSearch = (0, _react.useCallback)(() => {
    if (isExpanded) {
      handleSearchClose();
    } else {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded, handleSearchClose]);
  return /*#__PURE__*/_react.default.createElement("div", {
    className: _stylesModule.default.searchContainer
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: `${_stylesModule.default.searchWrapper} ${isExpanded ? _stylesModule.default.expanded : ''}`
  }, isExpanded ? /*#__PURE__*/_react.default.createElement(_antd.Tooltip, {
    title: "Click to close",
    placement: "bottom",
    mouseEnterDelay: 0.5,
    overlayClassName: _stylesModule.default.searchTooltip,
    overlayInnerStyle: {
      paddingTop: '10px'
    },
    align: {
      offset: [0, 15]
    }
  }, /*#__PURE__*/_react.default.createElement(_icons.SearchOutlined, {
    className: _stylesModule.default.searchIcon,
    onClick: toggleSearch
  })) : /*#__PURE__*/_react.default.createElement(_icons.SearchOutlined, {
    className: _stylesModule.default.searchIcon,
    onClick: toggleSearch
  }), /*#__PURE__*/_react.default.createElement(_antd.Input, {
    ref: inputRef,
    placeholder: "Search documentation...",
    value: searchTerm,
    onChange: handleSearchChange,
    onKeyDown: handleKeyDown,
    className: `${_stylesModule.default.searchInput} ${isExpanded ? _stylesModule.default.visible : ''}`,
    "aria-expanded": isExpanded,
    "aria-controls": "search-results",
    "aria-autocomplete": "list"
  })), isExpanded && searchTerm && /*#__PURE__*/_react.default.createElement("div", {
    id: "search-results",
    className: _stylesModule.default.dropdownResults,
    ref: dropdownRef,
    role: "listbox"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: _stylesModule.default.resultCount
  }, searchResults.length === 0 ? 'No results found' : `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`), searchResults.map((item, index) => renderSearchResult(item, index))));
};
var _default = exports.default = Search;