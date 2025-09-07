"use strict";

// src/index.js

const path = require('path');
const fs = require('fs-extra');
const matter = require('gray-matter');
const {
  extractHeadingsWithContent
} = require('./utils/headingUtils');
module.exports = function smartSearchPlugin(context, options) {
  const searchIndexCache = new Map();
  return {
    name: 'smart-search-plugin',
    async loadContent() {
      console.log('Smart Search Plugin: Starting loadContent');
      const docsDir = path.join(context.siteDir, 'docs');
      console.log('Smart Search Plugin: Docs directory:', docsDir);
      if (!fs.existsSync(docsDir)) {
        console.warn('Smart Search Plugin: Docs directory not found:', docsDir);
        return [];
      }
      const searchIndex = [];
      const excludedFolders = ['contributor-guide', 'includes', '_includes'];
      const excludedPrefixes = ['_']; // Files starting with underscore

      function getFileHash(filePath) {
        const stats = fs.statSync(filePath);
        return `${stats.size}-${stats.mtime.getTime()}`;
      }
      function shouldExclude(filePath) {
        const relativePath = path.relative(docsDir, filePath);

        // Check excluded folders
        if (excludedFolders.some(folder => relativePath.includes(`${path.sep}${folder}${path.sep}`) || relativePath.startsWith(`${folder}${path.sep}`) || relativePath === folder)) {
          return true;
        }

        // Check file/folder name prefixes
        const parts = relativePath.split(path.sep);
        return parts.some(part => excludedPrefixes.some(prefix => part.startsWith(prefix)));
      }
      async function processDirectory(dir) {
        if (shouldExclude(dir)) {
          console.log('Smart Search Plugin: Skipping excluded directory:', dir);
          return;
        }
        console.log('Smart Search Plugin: Processing directory:', dir);
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stats = fs.statSync(filePath);

            // Skip files/folders starting with underscore
            if (shouldExclude(filePath)) {
              console.log('Smart Search Plugin: Skipping excluded file/folder:', file);
              continue;
            }
            if (stats.isDirectory()) {
              await processDirectory(filePath);
            } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
              try {
                const fileHash = getFileHash(filePath);
                const cachedHash = searchIndexCache.get(filePath);
                if (cachedHash === fileHash) {
                  const cachedEntry = searchIndexCache.get(`${filePath}-entry`);
                  if (cachedEntry) {
                    searchIndex.push(cachedEntry);
                    continue;
                  }
                }
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const {
                  data: frontMatter,
                  content
                } = matter(fileContent);

                // Skip draft documents
                if (frontMatter.draft === true) {
                  console.log('Smart Search Plugin: Skipping draft:', file);
                  continue;
                }
                const relativeFilePath = path.relative(docsDir, filePath);
                const url = '/' + relativeFilePath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/').replace(/\/index$/, '').replace(/\/[^\/]+\/\1$/, '/$1');
                if (url === '/') continue;
                console.log('Smart Search Plugin: Processing file:', file);
                const sections = await extractHeadingsWithContent(content);
                const id = frontMatter.id || url.split('/').pop();
                const entry = {
                  id,
                  title: frontMatter.title || '',
                  description: frontMatter.description || '',
                  keywords: Array.isArray(frontMatter.keywords) ? frontMatter.keywords : [],
                  last_update: frontMatter.last_update || null,
                  url,
                  content: content.slice(0, 300),
                  sections: sections.map(section => ({
                    ...section,
                    url: `${url}#${section.id}`
                  }))
                };

                // Only index documents that have a title
                if (!entry.title) {
                  console.log('Smart Search Plugin: Skipping untitled document:', file);
                  continue;
                }
                searchIndexCache.set(filePath, fileHash);
                searchIndexCache.set(`${filePath}-entry`, entry);
                searchIndex.push(entry);
                console.log('Smart Search Plugin: Added to search index:', entry.title);
              } catch (error) {
                console.error(`Error processing file ${filePath}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error accessing file ${filePath}:`, error);
          }
        }
      }
      try {
        await processDirectory(docsDir);
        console.log('Smart Search Plugin: Final search index size:', searchIndex.length);
        return searchIndex;
      } catch (error) {
        console.error('Error generating search index:', error);
        return [];
      }
    },
    async contentLoaded({
      content,
      actions
    }) {
      const {
        createData
      } = actions;
      try {
        // Ensure content is an array
        const searchData = Array.isArray(content) ? content : [];
        if (searchData.length === 0) {
          console.warn('Smart Search Plugin: Warning - Search index is empty');
        } else {
          console.log('Smart Search Plugin: Successfully indexed', searchData.length, 'documents');
        }

        // Create the static directory if it doesn't exist
        const staticDir = path.join(context.siteDir, 'static');
        await fs.ensureDir(staticDir);

        // Write to static directory
        const searchIndexPath = path.join(staticDir, 'searchIndex.json');
        await fs.writeJson(searchIndexPath, searchData, {
          spaces: 2
        });
        console.log('Smart Search Plugin: Wrote search index to:', searchIndexPath);

        // Write to plugin data directory
        await createData('searchIndex.json', JSON.stringify(searchData));
        console.log('Smart Search Plugin: Created search data file');
      } catch (error) {
        console.error('Smart Search Plugin: Error in contentLoaded:', error);
        throw error;
      }
    },
    configureWebpack(config, isServer) {
      return {
        resolve: {
          alias: {
            '@theme/SearchBar': path.resolve(__dirname, 'theme/SearchBar/Search')
          }
        }
      };
    },
    getThemePath() {
      return path.resolve(__dirname, 'theme');
    },
    getTypeScriptThemePath() {
      return path.resolve(__dirname, 'src', 'theme');
    }
  };
};