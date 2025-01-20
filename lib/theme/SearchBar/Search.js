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
      }),
      author: typeof lastUpdate === 'object' ? lastUpdate.author : null
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
        console.log('Search Component: Initializing Fuse with options:', fuseOptions);
        const fuseInstance = new _fuse.default(data, fuseOptions);
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
    if (_ExecutionEnvironment.default.canUseDOM) {
      initializeSearch();
    }
  }, []);
  const performSearch = (0, _react.useCallback)(term => {
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
      results.filter(result => result.score <= 0.4) // Keep only good matches
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
            return section.heading?.toLowerCase().includes(searchTermLower) || section.content?.toLowerCase().includes(searchTermLower);
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
  const handleSearchChange = (0, _react.useCallback)(e => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  }, [performSearch]);

  // Handle navigation to search result
  const navigateToPage = (0, _react.useCallback)(url => {
    closeSearch();
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    history.replace(formattedUrl);
  }, [history]);

  // Close search and reset state
  const closeSearch = (0, _react.useCallback)(() => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (0, _react.useCallback)(e => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
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
    return /*#__PURE__*/_react.default.createElement("div", {
      ref: el => resultRefs.current[index] = el,
      key: `${item.type}-${item.url}-${index}`,
      className: `${_stylesModule.default.resultItem} ${item.type === 'section' ? _stylesModule.default.sectionResult : ''} ${isSelected ? _stylesModule.default.selected : ''}`,
      onClick: () => navigateToPage(item.url),
      onMouseEnter: () => setSelectedIndex(index),
      onKeyDown: e => {
        if (e.key === 'Enter') {
          navigateToPage(item.url);
        }
      },
      tabIndex: 0,
      role: "button",
      "aria-selected": isSelected
    }, item.type === 'document' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultTitle
    }, item.title), /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultDescription
    }, item.previewContent), item.last_update && /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultMeta
    }, formatDate(item.last_update)?.date && `Last updated: ${formatDate(item.last_update).date}`, formatDate(item.last_update)?.author && ` by ${formatDate(item.last_update).author}`)) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultParent
    }, item.parentTitle), /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultTitle
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: _stylesModule.default.sectionMarker
    }, "\xA7"), item.heading), /*#__PURE__*/_react.default.createElement("div", {
      className: _stylesModule.default.resultDescription
    }, item.previewContent)));
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
  return /*#__PURE__*/_react.default.createElement("div", {
    className: _stylesModule.default.searchContainer
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: `${_stylesModule.default.searchWrapper} navbar-search-container ${isExpanded ? _stylesModule.default.expanded : ''}`
  }, /*#__PURE__*/_react.default.createElement(_icons.SearchOutlined, {
    className: _stylesModule.default.searchIcon,
    onClick: e => {
      e.preventDefault();
      if (isExpanded && !searchTerm) {
        closeSearch();
      } else {
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
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