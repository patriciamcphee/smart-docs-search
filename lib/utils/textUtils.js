"use strict";

exports.__esModule = true;
exports.highlightText = void 0;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Highlights occurrences of search terms within text
 * @param {string} text - The text to highlight
 * @param {string} searchTerm - The search term(s) to highlight
 * @param {string} highlightClassName - CSS class to apply to highlighted text
 * @returns {Array} Array of text and highlighted elements
 */
const highlightText = (text, searchTerm, highlightClassName) => {
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
        className: highlightClassName
      }, part);
    }
    return part;
  });
};
exports.highlightText = highlightText;