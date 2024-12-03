// src/index.js
import path from 'path';
import { SearchAPI } from './server/api/search';
import { generateSearchIndex } from './server/indexer/generateIndex';

class DocsSearchPlugin {
  constructor(opts = {}) {
    this.options = {
      indexPath: '/searchIndex.json',
      apiEndpoint: null,
      dbConfig: null,
      excludePaths: [],
      preprocessors: [],
      ...opts
    };
  }

  // Plugin configuration for Docusaurus
  docusaurusPlugin() {
    const plugin = {
      name: 'docs-search-plugin',
      
      async loadContent() {
        if (this.options.dbConfig) {
          const searchApi = new SearchAPI(this.options.dbConfig);
          await searchApi.initialize();
          return searchApi;
        }
        return null;
      },
      
      async contentLoaded({ content, actions }) {
        const { createData, addRoute } = actions;
        
        if (content) {
          // Set up API routes for database-driven search
          addRoute({
            path: '/api/search',
            component: '@site/src/components/SearchAPI',
            modules: {
              searchApi: content
            },
            exact: true
          });
        }
        
        // Generate static search index if not using database
        if (!this.options.dbConfig) {
          const searchIndex = await generateSearchIndex({
            ...this.options,
            outputPath: path.join(actions.outDir, 'searchIndex.json')
          });
          await createData('searchIndex.json', JSON.stringify(searchIndex));
        }
      },
      
      getThemePath() {
        return path.resolve(__dirname, './client/components');
      },
      
      getClientModules() {
        return [path.resolve(__dirname, './client/css/search.css')];
      }
    };
    
    return plugin;
  }

  // Plugin configuration for Nextra
  nextraPlugin() {
    return {
      name: 'docs-search-plugin',
      
      // Nextra-specific configuration
      extends: {
        theme: {
          layout: './client/components/SearchLayout'
        }
      },
      
      // Rest of the configuration similar to Docusaurus
      ...this.docusaurusPlugin()
    };
  }
}

export default DocsSearchPlugin;