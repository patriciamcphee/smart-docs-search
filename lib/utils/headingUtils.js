"use strict";

// src/utils/headingUtils.js

const {
  unified
} = require('unified');
const remarkParse = require('remark-parse');
const {
  visit
} = require('unist-util-visit');
function generateHeadingId(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
function extractTextFromNode(node) {
  if (node.type === 'text') {
    return node.value;
  }
  if (node.children) {
    return node.children.map(child => extractTextFromNode(child)).join('');
  }
  return '';
}
async function extractHeadingsWithContent(content) {
  try {
    const sections = [];
    let currentHeading = null;
    let currentContent = [];
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);
    visit(ast, node => {
      if (node.type === 'heading') {
        // Save previous section if exists
        if (currentHeading) {
          sections.push({
            id: generateHeadingId(currentHeading.text),
            heading: currentHeading.text,
            level: currentHeading.depth,
            content: currentContent.join(' ').trim().slice(0, 200)
          });
        }

        // Start new section
        currentHeading = {
          text: extractTextFromNode(node),
          depth: node.depth
        };
        currentContent = [];
      } else if (node.type === 'text' && currentHeading) {
        // Collect text content for current section
        currentContent.push(node.value);
      } else if (node.type === 'paragraph' && currentHeading && node.children) {
        // Extract text from paragraph children
        const paragraphText = node.children.map(child => extractTextFromNode(child)).join('');
        if (paragraphText.trim()) {
          currentContent.push(paragraphText);
        }
      }
    });

    // Add the last section if exists
    if (currentHeading) {
      sections.push({
        id: generateHeadingId(currentHeading.text),
        heading: currentHeading.text,
        level: currentHeading.depth,
        content: currentContent.join(' ').trim().slice(0, 200)
      });
    }
    return sections;
  } catch (error) {
    console.error('Error in extractHeadingsWithContent:', error);
    console.error('Error details:', error.stack);

    // Return empty array instead of throwing to prevent build failures
    return [];
  }
}
module.exports = {
  generateHeadingId,
  extractHeadingsWithContent
};