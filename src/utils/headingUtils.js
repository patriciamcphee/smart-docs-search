// src/utils/headingUtils.js
const unified = require('unified');
const remarkParse = require('remark-parse');
const visit = require('unist-util-visit');

/**
 * Generates a URL-friendly ID from a heading text
 * Similar to Docusaurus's heading ID generation
 */
function generateHeadingId(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Convert non-alphanumeric to hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts headings and their associated content from markdown text
 * Returns an array of section objects with heading info and content
 */
function extractHeadingsWithContent(content) {
  const sections = [];
  let currentHeading = null;
  let currentContent = [];
  
  // Parse markdown into AST (Abstract Syntax Tree)
  const ast = unified()
    .use(remarkParse)
    .parse(content);
  
  // Visit each node in the AST
  visit(ast, (node) => {
    if (node.type === 'heading') {
      // When we find a new heading, save the previous section if it exists
      if (currentHeading) {
        sections.push({
          id: generateHeadingId(currentHeading.text),
          heading: currentHeading.text,
          level: currentHeading.depth,
          content: currentContent.join(' ').trim().slice(0, 200) // Limit content preview
        });
      }
      
      // Start a new section with the current heading
      currentHeading = {
        text: node.children.map(child => child.value).join(''),
        depth: node.depth
      };
      currentContent = [];
    } 
    // Collect text content under the current heading
    else if (node.type === 'text' && currentHeading) {
      currentContent.push(node.value);
    }
  });
  
  // Don't forget to save the last section
  if (currentHeading) {
    sections.push({
      id: generateHeadingId(currentHeading.text),
      heading: currentHeading.text,
      level: currentHeading.depth,
      content: currentContent.join(' ').trim().slice(0, 200)
    });
  }
  
  return sections;
}

module.exports = {
  generateHeadingId,
  extractHeadingsWithContent
};