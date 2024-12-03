// scripts/generateSearchIndex.js
const fs = require('fs');
const path = require('path');
const lunr = require('lunr');

async function generateSearchIndex(options) {
  const {
    docsDir,
    outputPath = 'public/searchIndex.json',
    ignore = []
  } = options;

  const pages = {};
  const documents = [];

  // Recursive function to process all markdown files
  async function processDirectory(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (ignore.some(pattern => fullPath.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        const content = await fs.promises.readFile(fullPath, 'utf8');
        const id = fullPath.replace(docsDir, '').replace(/\.[^/.]+$/, '');
        
        const document = {
          id,
          title: extractTitle(content),
          content: processContent(content),
          url: generateUrl(id)
        };

        pages[id] = document;
        documents.push(document);
      }
    }
  }

  await processDirectory(docsDir);

  // Build the search index
  const index = lunr(function() {
    this.ref('id');
    this.field('title', { boost: 10 });
    this.field('content');

    documents.forEach(doc => {
      this.add(doc);
    });
  });

  // Save the search index
  const searchIndex = {
    pages,
    index: index.toJSON()
  };

  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(searchIndex, null, 2)
  );
}

module.exports = generateSearchIndex;