// src/server/indexer/processors/mdxProcessor.js
import { markdownProcessor } from './markdownProcessor';
import matter from 'gray-matter';

/**
 * Processes MDX files and extracts searchable content
 * Extends the markdown processor with MDX-specific handling
 * @param {string} content - Raw file content
 * @param {Object} options - Processing options
 * @returns {Object} Processed document ready for indexing
 */
export async function mdxProcessor(content, options) {
  // First, process the content using the base markdown processor
  const baseDocument = await markdownProcessor(content, options);
  
  if (!baseDocument) {
    return null;
  }

  const { data: frontMatter } = matter(content);

  // Extract MDX-specific content and metadata
  const mdxExtras = extractMDXContent(content, frontMatter);

  // Merge the base document with MDX-specific additions
  return {
    ...baseDocument,
    type: 'mdx',
    keywords: [...baseDocument.keywords, ...mdxExtras.keywords],
    metadata: {
      ...baseDocument.metadata,
      ...mdxExtras.metadata,
      hasComponents: mdxExtras.hasComponents,
      components: mdxExtras.components
    }
  };
}

/**
 * Extracts MDX-specific content and metadata
 */
function extractMDXContent(content, frontMatter) {
  const extras = {
    keywords: new Set(),
    metadata: {},
    hasComponents: false,
    components: new Set()
  };

  // Extract imported component names
  const importRegex = /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"][^'"]+['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const components = match[1].split(',').map(comp => comp.trim());
    components.forEach(comp => {
      extras.components.add(comp);
      extras.keywords.add(comp.toLowerCase());
    });
    extras.hasComponents = true;
  }

  // Extract JSX component usage
  const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  while ((match = jsxRegex.exec(content)) !== null) {
    extras.components.add(match[1]);
    extras.keywords.add(match[1].toLowerCase());
    extras.hasComponents = true;
  }

  // Handle MDX-specific frontmatter
  if (frontMatter.components) {
    frontMatter.components.forEach(comp => {
      extras.components.add(comp);
      extras.keywords.add(comp.toLowerCase());
    });
  }

  // Extract export statements as they might contain useful metadata
  const exportRegex = /export\s+const\s+(\w+)\s*=\s*(['"].*?['"]|\{[\s\S]*?\})/g;
  while ((match = exportRegex.exec(content)) !== null) {
    try {
      const value = eval(match[2]); // Safely evaluate simple exports
      extras.metadata[match[1]] = value;
    } catch (error) {
      // Skip complex expressions that can't be safely evaluated
      console.warn(`Skipping complex export in MDX: ${match[1]}`);
    }
  }

  return {
    keywords: Array.from(extras.keywords),
    metadata: extras.metadata,
    hasComponents: extras.hasComponents,
    components: Array.from(extras.components)
  };
}

/**
 * Safely remove MDX-specific syntax that might interfere with markdown processing
 */
function cleanMDXSyntax(content) {
  return content
    // Remove import statements
    .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
    // Remove export statements
    .replace(/export\s+.*?;?\s*/g, '')
    // Remove JSX components but keep their children
    .replace(/<([A-Z][a-zA-Z0-9]*)[^>]*>([\s\S]*?)<\/\1>/g, '$2')
    // Remove self-closing JSX components
    .replace(/<[A-Z][a-zA-Z0-9]*[^>]*\/>\s*/g, '');
}

export default mdxProcessor;