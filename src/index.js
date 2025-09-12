/**
 * Copyright (c) Patricia McPhee.
 *
 * This source code is licensed under the MIT license.
 */

const path = require('path');
const fs = require('fs-extra');
const matter = require('gray-matter');

// Simple heading extraction without heavy dependencies
function extractHeadingsWithContent(content) {
  const sections = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const heading = headingMatch[2];
      const id = heading.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      
      sections.push({
        id,
        heading,
        level,
        content: '', // Simple version without content extraction
        url: `#${id}`
      });
    }
  }
  
  return sections;
}

module.exports = function smartSearchPlugin(context, options = {}) {
  const {
    excludedFolders = ['contributor-guide', 'includes', '_includes'],
    excludedPrefixes = ['_'],
    searchWeights = {
      title: 1.0,
      'sections.heading': 1.0,
      keywords: 0.8,
      description: 0.6,
      'sections.content': 0.5,
      content: 0.4
    }
  } = options;

  return {
    name: 'smart-search-plugin',
    
    async loadContent() {
      console.log('[Smart Search]: Starting content indexing');
      const docsDir = path.join(context.siteDir, 'docs');
      
      if (!fs.existsSync(docsDir)) {
        console.warn('[Smart Search]: Docs directory not found:', docsDir);
        return [];
      }

      const searchIndex = [];

      function shouldExclude(filePath) {
        const relativePath = path.relative(docsDir, filePath);
        
        if (excludedFolders.some(folder => 
          relativePath.includes(`${path.sep}${folder}${path.sep}`) || 
          relativePath.startsWith(`${folder}${path.sep}`) ||
          relativePath === folder
        )) {
          return true;
        }

        const parts = relativePath.split(path.sep);
        return parts.some(part => excludedPrefixes.some(prefix => part.startsWith(prefix)));
      }

      async function processDirectory(dir) {
        if (shouldExclude(dir)) {
          console.log('[Smart Search]: Skipping excluded directory:', dir);
          return;
        }

        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          
          try {
            const stats = fs.statSync(filePath);
            
            if (shouldExclude(filePath)) {
              continue;
            }
      
            if (stats.isDirectory()) {
              await processDirectory(filePath);
            } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
              try {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const { data: frontMatter, content } = matter(fileContent);
                
                if (frontMatter.draft === true || frontMatter.search_exclude === true) {
                  console.log('[Smart Search]: Skipping excluded file:', file);
                  continue;
                }
        
                const relativeFilePath = path.relative(docsDir, filePath);
                const url = '/' + relativeFilePath
                  .replace(/\.(md|mdx)$/, '')
                  .replace(/\\/g, '/')
                  .replace(/\/index$/, '')
                  .replace(/\/[^\/]+\/\1$/, '/$1');
                
                if (url === '/') continue;
                
                console.log('[Smart Search]: Processing:', file);
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
                  sections: sections.map(section => ({
                    ...section,
                    url: `${url}#${section.id}`
                  }))
                };

                if (!entry.title) {
                  console.log('[Smart Search]: Skipping untitled document:', file);
                  continue;
                }
                
                searchIndex.push(entry);
              } catch (error) {
                console.error(`[Smart Search]: Error processing ${filePath}:`, error);
              }
            }
          } catch (error) {
            console.error(`[Smart Search]: Error accessing ${filePath}:`, error);
          }
        }
      }

      try {
        await processDirectory(docsDir);
        console.log('[Smart Search]: Indexed', searchIndex.length, 'documents');
        return { searchIndex, searchWeights };
      } catch (error) {
        console.error('[Smart Search]: Error generating index:', error);
        return { searchIndex: [], searchWeights };
      }
    },

    async contentLoaded({content, actions}) {
      const {createData, setGlobalData} = actions;
      
      try {
        const { searchIndex, searchWeights } = content || { searchIndex: [], searchWeights: {} };
        
        if (searchIndex.length === 0) {
          console.warn('[Smart Search]: Warning - Search index is empty');
        } else {
          console.log('[Smart Search]: Successfully indexed', searchIndex.length, 'documents');
        }

        // Write to static directory for backward compatibility
        const staticDir = path.join(context.siteDir, 'static');
        await fs.ensureDir(staticDir);
        
        const searchIndexPath = path.join(staticDir, 'searchIndex.json');
        await fs.writeJson(searchIndexPath, searchIndex, { spaces: 2 });
        
        // Also make available through Docusaurus data system
        await createData('searchIndex.json', JSON.stringify(searchIndex));
        await createData('searchConfig.json', JSON.stringify({ weights: searchWeights }));
        
        // Set global data for theme access
        setGlobalData({
          searchIndex,
          searchWeights
        });
        
        console.log('[Smart Search]: Search data created successfully');
      } catch (error) {
        console.error('[Smart Search]: Error in contentLoaded:', error);
        throw error;
      }
    },

    configureWebpack(config, isServer) {
      return {
        resolve: {
          alias: {
            '@theme/SearchBar': path.resolve(__dirname, './client/theme/SearchBar'),
          },
        },
      };
    },

    getThemePath() {
      return path.resolve(__dirname, './client/theme');
    },

    getClientModules() {
      return [];
    }
  };
};