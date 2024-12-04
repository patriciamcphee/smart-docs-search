// src/server/indexer/processors/markdownProcessor.js
import matter from 'gray-matter';
import path from 'path';

/**
 * Processes markdown files and extracts searchable content
 * @param {string} content - Raw file content
 * @param {Object} options - Processing options
 * @param {string} options.filePath - Path to the file being processed
 * @param {Function} options.normalizeUrl - URL normalization function
 * @returns {Object} Processed document ready for indexing
 */
export async function markdownProcessor(content, options) {
  const { filePath, normalizeUrl } = options;
  
  // Parse frontmatter and content
  const { data: frontMatter, content: markdownContent } = matter(content);

  // Skip draft content
  if (frontMatter.draft === true) {
    return null;
  }

  // Extract relative path for URL generation
  const relativeFilePath = path.relative(process.cwd(), filePath);

  // Generate URL from file path
  const url = normalizeUrl(relativeFilePath);

  // Extract last update information
  const lastUpdate = extractLastUpdate(frontMatter);

  // Generate unique ID
  const id = frontMatter.id || url.split('/').pop() || Math.random().toString(36).substr(2, 9);

  // Extract keywords from frontmatter and content
  const keywords = extractKeywords(frontMatter, markdownContent);

  // Construct the indexed document
  const document = {
    id,
    title: frontMatter.title || '',
    description: frontMatter.description || extractDescription(markdownContent),
    keywords,
    last_update: lastUpdate,
    url,
    // Add additional metadata that might be useful for search
    type: 'markdown',
    metadata: {
      sidebar_label: frontMatter.sidebar_label,
      sidebar_position: frontMatter.sidebar_position,
      custom_edit_url: frontMatter.custom_edit_url,
      ...frontMatter.metadata
    }
  };

  return document;
}

/**
 * Extracts last update information from frontmatter
 */
function extractLastUpdate(frontMatter) {
  if (frontMatter.last_update) {
    return {
      date: frontMatter.last_update.date,
      author: frontMatter.last_update.author || null
    };
  }
  
  if (frontMatter.last_update_time) {
    return {
      date: new Date(frontMatter.last_update_time).toISOString(),
      author: frontMatter.last_update_author || null
    };
  }

  return null;
}

/**
 * Extracts keywords from frontmatter and content
 */
function extractKeywords(frontMatter, content) {
  const keywords = new Set();

  // Add explicit keywords from frontmatter
  if (Array.isArray(frontMatter.keywords)) {
    frontMatter.keywords.forEach(keyword => {
      if (keyword?.trim()) {
        keywords.add(keyword.toLowerCase().trim());
      }
    });
  }

  // Extract h1 and h2 headings as keywords
  const headingRegex = /^#{1,2}\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    keywords.add(match[1].toLowerCase().trim());
  }

  // Add tags as keywords
  if (Array.isArray(frontMatter.tags)) {
    frontMatter.tags.forEach(tag => {
      if (tag?.trim()) {
        keywords.add(tag.toLowerCase().trim());
      }
    });
  }

  return Array.from(keywords);
}

/**
 * Extracts a description from the content if not provided in frontmatter
 */
function extractDescription(content) {
  // Remove code blocks
  const withoutCode = content.replace(/```[\s\S]*?```/g, '');
  
  // Remove headers
  const withoutHeaders = withoutCode.replace(/^#{1,6}\s+.+$/gm, '');
  
  // Find first paragraph
  const paragraphMatch = withoutHeaders.match(/^[^#\n].+/m);
  
  if (paragraphMatch) {
    // Trim and limit length
    return paragraphMatch[0].trim().substring(0, 200);
  }
  
  return '';
}

export default markdownProcessor;