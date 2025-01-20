// src/index.js
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { extractHeadingsWithContent } = require('./utils/headingUtils');

module.exports = function smartSearchPlugin(context, options) {
  const searchIndexCache = new Map();
  
  return {
    name: 'smart-search-plugin',
    
    async loadContent() {
      const docsDir = path.join(context.siteDir, 'docs');
      const searchIndex = [];
      const excludedFolders = ['contributor-guide'];

      function getFileHash(filePath) {
        const stats = fs.statSync(filePath);
        return `${stats.size}-${stats.mtime.getTime()}`;
      }

      function shouldExcludeFolder(folderPath) {
        return excludedFolders.some(folder => 
          folderPath.includes(`${path.sep}${folder}`) || 
          folderPath.endsWith(folder)
        );
      }

      function processDirectory(dir) {
        if (shouldExcludeFolder(dir)) return;
      
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
      
          if (stats.isDirectory()) {
            processDirectory(filePath);
          } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            try {
              // Check cache for unchanged files
              const fileHash = getFileHash(filePath);
              const cachedHash = searchIndexCache.get(filePath);
              
              if (cachedHash === fileHash) {
                const cachedEntry = searchIndexCache.get(`${filePath}-entry`);
                if (cachedEntry) {
                  searchIndex.push(cachedEntry);
                  return;
                }
              }

              const fileContent = fs.readFileSync(filePath, 'utf-8');
              const { data: frontMatter, content } = matter(fileContent);
              
              // Skip draft documents
              if (frontMatter.draft === true) return;
      
              const relativeFilePath = path.relative(docsDir, filePath);
              const url = '/' + relativeFilePath
                .replace(/\.(md|mdx)$/, '')
                .replace(/\\/g, '/')
                .replace(/\/index$/, '')
                .replace(/\/[^\/]+\/\1$/, '/$1');
              
              // Skip root page and excluded folders
              if (url === '/' || shouldExcludeFolder(relativeFilePath)) return;
              
              // Extract headings and their content
              const sections = extractHeadingsWithContent(content);
              
              const id = frontMatter.id || url.split('/').pop();
              const entry = {
                id,
                title: frontMatter.title || '',
                description: frontMatter.description || '',
                keywords: Array.isArray(frontMatter.keywords) ? frontMatter.keywords : [],
                last_update: frontMatter.last_update || null,
                url,
                content: content.slice(0, 300),
                // Add section data with complete URLs
                sections: sections.map(section => ({
                  ...section,
                  url: `${url}#${section.id}`
                }))
              };

              // Update cache
              searchIndexCache.set(filePath, fileHash);
              searchIndexCache.set(`${filePath}-entry`, entry);
              
              searchIndex.push(entry);
            } catch (error) {
              console.error(`Error processing file ${filePath}:`, error);
            }
          }
        });
      }

      try {
        processDirectory(docsDir);
        return searchIndex;
      } catch (error) {
        console.error('Error generating search index:', error);
        return [];
      }
    },

    async contentLoaded({content, actions}) {
      const {createData} = actions;
      
      // Ensure static directory exists
      const staticDir = path.join(context.siteDir, 'static');
      if (!fs.existsSync(staticDir)) {
        fs.mkdirSync(staticDir, { recursive: true });
      }
      
      // Write search index files
      const searchIndexPath = path.join(staticDir, 'searchIndex.json');
      fs.writeFileSync(searchIndexPath, JSON.stringify(content, null, 2));
      await createData('searchIndex.json', JSON.stringify(content));
    },

    configureWebpack(config, isServer) {
      return {
        resolve: {
          alias: {
            '@theme/SearchBar': path.resolve(__dirname, 'theme/SearchBar/Search'),
          },
        },
      };
    },
  };
};