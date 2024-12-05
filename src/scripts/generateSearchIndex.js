const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function generateSearchIndex() {
  const docsDir = path.join(process.cwd(), 'docs');
  const searchIndex = [];
  const excludedFolders = ['contributor-guide'];

  function shouldExcludeFolder(folderPath) {
    return excludedFolders.some(folder => 
      folderPath.includes(`${path.sep}${folder}`) || 
      folderPath.endsWith(folder)
    );
  }

  function extractLastUpdate(frontMatter) {
    if (frontMatter.last_update) {
      return {
        date: frontMatter.last_update.date,
        author: frontMatter.last_update.author || null
      };
    }
    
    if (frontMatter.last_update_time) {
      return {
        date: new Date(frontMatter.last_update_time).toISOString(),
        author: frontMatter.last_update_author || null
      };
    }
    return null;
  }

  function normalizeUrl(relativePath) {
    // Remove file extension
    let url = relativePath.replace(/\.(md|mdx)$/, '');
    
    // Replace Windows backslashes with forward slashes
    url = url.replace(/\\/g, '/');
    
    // Handle index files
    url = url.replace(/\/index$/, '');
    
    // Handle files that share name with their parent directory
    const parts = url.split('/');
    if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
      parts.pop();
      url = parts.join('/');
    }
    
    // Ensure URL starts with forward slash
    return url.startsWith('/') ? url : '/' + url;
  }

  function processDirectory(dir) {
    if (shouldExcludeFolder(dir)) {
      console.log(`Skipping excluded directory: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const { data: frontMatter } = matter(fileContent);
          
          // Skip draft content
          if (frontMatter.draft === true) {
            console.log(`Skipping draft content: ${filePath}`);
            return;
          }

          const relativeFilePath = path.relative(docsDir, filePath);
          
          if (shouldExcludeFolder(relativeFilePath)) {
            console.log(`Skipping file in excluded directory: ${filePath}`);
            return;
          }

          // Generate the normalized URL
          const url = normalizeUrl(relativeFilePath);
          
          // Use frontMatter.id if available, otherwise derive from the URL
          const id = frontMatter.id || url.split('/').pop();

          const lastUpdate = extractLastUpdate(frontMatter);
          searchIndex.push({
            id: id,
            title: frontMatter.title || '',
            description: frontMatter.description || '',
            keywords: Array.isArray(frontMatter.keywords) ? frontMatter.keywords : [],
            last_update: lastUpdate,
            url: url
          });
          console.log(`Indexed: ${url} (id: ${id})`);
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    });
  }

  try {
    processDirectory(docsDir);
    
    const outputPath = path.join(process.cwd(), 'static');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const outputFilePath = path.join(outputPath, 'searchIndex.json');
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(searchIndex, null, 2)
    );

    console.log(`Generated search index with ${searchIndex.length} documents`);
    console.log(`Search index saved to: ${outputFilePath}`);
  } catch (error) {
    console.error('Error generating search index:', error);
    process.exit(1);
  }
}

generateSearchIndex();