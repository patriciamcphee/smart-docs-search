import React from 'react';

/**
 * Highlights occurrences of search terms within text
 * @param {string} text - The text to highlight
 * @param {string} searchTerm - The search term(s) to highlight
 * @param {string} highlightClassName - CSS class to apply to highlighted text
 * @returns {Array} Array of text and highlighted elements
 */
export const highlightText = (text, searchTerm, highlightClassName) => {
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
      return <mark key={i} className={highlightClassName}>{part}</mark>;
    }
    return part;
  });
};