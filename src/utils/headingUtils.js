// src/utils/headingUtils.js
const unified = require('unified');
const remarkParse = require('remark-parse');
const visit = require('unist-util-visit');

function generateHeadingId(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function extractHeadingsWithContent(content) {
  try {
    const sections = [];
    let currentHeading = null;
    let currentContent = [];
    
    const processor = unified().use(remarkParse);
    const ast = processor.parse(content);
    
    visit(ast, (node) => {
      if (node.type === 'heading') {
        if (currentHeading) {
          sections.push({
            id: generateHeadingId(currentHeading.text),
            heading: currentHeading.text,
            level: currentHeading.depth,
            content: currentContent.join(' ').trim().slice(0, 200)
          });
        }
        
        currentHeading = {
          text: node.children.map(child => child.value).join(''),
          depth: node.depth
        };
        currentContent = [];
      } 
      else if (node.type === 'text' && currentHeading) {
        currentContent.push(node.value);
      }
    });
    
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
    throw error;
  }
}

module.exports = {
  generateHeadingId,
  extractHeadingsWithContent
};