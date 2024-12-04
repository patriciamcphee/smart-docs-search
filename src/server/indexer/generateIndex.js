// src/server/indexer/generateIndex.js
import path from 'path';
import fs from 'fs-extra';
import { markdownProcessor } from './processors/markdownProcessor';
import { mdxProcessor } from './processors/mdxProcessor';

export class SearchIndexGenerator {
  constructor(config) {
    this.config = {
      docsDir: 'docs',
      outputDir: 'static',
      excludedFolders: [],
      processors: {
        '.md': markdownProcessor,
        '.mdx': mdxProcessor
      },
      ...config
    };
  }

  normalizeUrl(relativePath) {
    let url = relativePath.replace(/\.(md|mdx)$/, '');
    url = url.replace(/\\/g, '/');
    url = url.replace(/\/index$/, '');
    
    const parts = url.split('/');
    if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
      parts.pop();
      url = parts.join('/');
    }
    
    return url.startsWith('/') ? url : `/${url}`;
  }

  shouldExcludeFolder(folderPath) {
    return this.config.excludedFolders.some(folder => 
      folderPath.includes(`${path.sep}${folder}`) || 
      folderPath.endsWith(folder)
    );
  }

  async processFile(filePath, version = null) {
    const ext = path.extname(filePath);
    const processor = this.config.processors[ext];
    
    if (!processor) {
      return null;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const result = await processor(content, {
        filePath,
        version,
        normalizeUrl: (relativePath) => this.normalizeUrl(relativePath)
      });

      if (result && !result.draft) {
        return result;
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
    return null;
  }

  async processDirectory(dir, version = null) {
    if (this.shouldExcludeFolder(dir)) {
      console.log(`Skipping excluded directory: ${dir}`);
      return [];
    }

    const files = await fs.readdir(dir);
    const results = [];

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        const subResults = await this.processDirectory(filePath, version);
        results.push(...subResults);
      } else {
        const result = await this.processFile(filePath, version);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  async generate(version = null) {
    try {
      const docsDir = path.join(process.cwd(), this.config.docsDir);
      const searchIndex = await this.processDirectory(docsDir, version);
      
      const outputDir = path.join(process.cwd(), this.config.outputDir);
      await fs.ensureDir(outputDir);

      const outputPath = path.join(
        outputDir,
        version ? `searchIndex.${version}.json` : 'searchIndex.json'
      );

      await fs.writeJson(outputPath, searchIndex, { spaces: 2 });
      
      console.log(`Generated search index with ${searchIndex.length} documents`);
      console.log(`Search index saved to: ${outputPath}`);
      
      return searchIndex;
    } catch (error) {
      console.error('Error generating search index:', error);
      throw error;
    }
  }
}

export default SearchIndexGenerator;