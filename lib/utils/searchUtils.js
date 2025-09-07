"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateRelevanceBoost = calculateRelevanceBoost;
exports.createSearchConfig = createSearchConfig;
exports.extractContentPreview = extractContentPreview;
exports.processKeywords = processKeywords;
exports.processSearchResults = processSearchResults;
exports.validateSearchIndex = validateSearchIndex;
function calculateRelevanceBoost(matchField, baseScore) {
  const boosts = {
    title: 1.5,
    'sections.heading': 1.3,
    keywords: 1.4,
    description: 1.2,
    'sections.content': 1.0
  };
  return baseScore * (boosts[matchField] || 1.0);
}
function processSearchResults(rawResults, maxResults = 10) {
  return rawResults.reduce((acc, result) => {
    const {
      item,
      score,
      matches
    } = result;
    const documentMatches = matches.filter(match => !match.path.includes('sections'));
    const sectionMatches = matches.filter(match => match.path.includes('sections'));
    if (documentMatches.length > 0) {
      const bestDocumentMatch = documentMatches.reduce((best, current) => {
        const adjustedScore = calculateRelevanceBoost(current.path[0], score);
        return adjustedScore < best.score ? {
          match: current,
          score: adjustedScore
        } : best;
      }, {
        score: Infinity
      }).match;
      acc.push({
        type: 'document',
        ...item,
        matchedField: bestDocumentMatch?.path[0],
        score: calculateRelevanceBoost(bestDocumentMatch?.path[0], score)
      });
    }
    sectionMatches.forEach(match => {
      const sectionIndex = parseInt(match.path[1]);
      const section = item.sections[sectionIndex];
      if (section) {
        acc.push({
          type: 'section',
          parentTitle: item.title,
          parentUrl: item.url,
          ...section,
          matchedField: match.path.slice(-1)[0],
          score: calculateRelevanceBoost(match.path.slice(-1)[0], score)
        });
      }
    });
    return acc;
  }, []).filter((result, index, self) => index === self.findIndex(r => r.type === result.type && r.url === result.url)).sort((a, b) => a.score - b.score).slice(0, maxResults);
}
function extractContentPreview(content, matchText, contextLength = 100) {
  if (!content || !matchText) return '';
  const matchIndex = content.toLowerCase().indexOf(matchText.toLowerCase());
  if (matchIndex === -1) return content.slice(0, contextLength * 2);
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + matchText.length + contextLength);
  let preview = content.slice(start, end);
  if (start > 0) preview = '...' + preview;
  if (end < content.length) preview = preview + '...';
  return preview;
}
function processKeywords(keywords) {
  const keywordArray = Array.isArray(keywords) ? keywords : typeof keywords === 'string' ? keywords.split(',') : [];
  return keywordArray.map(keyword => keyword?.toLowerCase()?.trim()).filter(Boolean).filter((value, index, self) => self.indexOf(value) === index);
}
function createSearchConfig(options = {}) {
  return {
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    distance: 100,
    useExtendedSearch: true,
    keys: [{
      name: 'keywords',
      weight: 0.7
    }, {
      name: 'title',
      weight: 0.5
    }, {
      name: 'description',
      weight: 0.3
    }, {
      name: 'sections.heading',
      weight: 0.6
    }, {
      name: 'sections.content',
      weight: 0.4
    }],
    ...options
  };
}
function validateSearchIndex(data) {
  // Convert single object to array if needed
  const indexArray = Array.isArray(data) ? data : [data];
  return indexArray.map(item => ({
    id: item.id || '',
    title: item.title || '',
    description: item.description || '',
    keywords: processKeywords(item.keywords || []),
    last_update: item.last_update || null,
    url: item.url || '',
    content: item.content || '',
    sections: (item.sections || []).map(section => ({
      id: section.id || '',
      heading: section.heading || '',
      level: section.level || 1,
      content: section.content || '',
      url: section.url || ''
    }))
  }));
}