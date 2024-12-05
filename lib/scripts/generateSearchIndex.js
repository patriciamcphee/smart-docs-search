"use strict";

var fs = require('fs');
var path = require('path');
var matter = require('gray-matter');
function generateSearchIndex() {
  var docsDir = path.join(process.cwd(), 'docs');
  var searchIndex = [];
  var excludedFolders = ['contributor-guide'];
  function shouldExcludeFolder(folderPath) {
    return excludedFolders.some(function (folder) {
      return folderPath.includes("".concat(path.sep).concat(folder)) || folderPath.endsWith(folder);
    });
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
    var url = relativePath.replace(/\.(md|mdx)$/, '');

    // Replace Windows backslashes with forward slashes
    url = url.replace(/\\/g, '/');

    // Handle index files
    url = url.replace(/\/index$/, '');

    // Handle files that share name with their parent directory
    var parts = url.split('/');
    if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
      parts.pop();
      url = parts.join('/');
    }

    // Ensure URL starts with forward slash
    return url.startsWith('/') ? url : '/' + url;
  }
  function processDirectory(dir) {
    if (shouldExcludeFolder(dir)) {
      console.log("Skipping excluded directory: ".concat(dir));
      return;
    }
    var files = fs.readdirSync(dir);
    files.forEach(function (file) {
      var filePath = path.join(dir, file);
      var stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        try {
          var fileContent = fs.readFileSync(filePath, 'utf-8');
          var _matter = matter(fileContent),
            frontMatter = _matter.data;

          // Skip draft content
          if (frontMatter.draft === true) {
            console.log("Skipping draft content: ".concat(filePath));
            return;
          }
          var relativeFilePath = path.relative(docsDir, filePath);
          if (shouldExcludeFolder(relativeFilePath)) {
            console.log("Skipping file in excluded directory: ".concat(filePath));
            return;
          }

          // Generate the normalized URL
          var url = normalizeUrl(relativeFilePath);

          // Use frontMatter.id if available, otherwise derive from the URL
          var id = frontMatter.id || url.split('/').pop();
          var lastUpdate = extractLastUpdate(frontMatter);
          searchIndex.push({
            id: id,
            title: frontMatter.title || '',
            description: frontMatter.description || '',
            keywords: Array.isArray(frontMatter.keywords) ? frontMatter.keywords : [],
            last_update: lastUpdate,
            url: url
          });
          console.log("Indexed: ".concat(url, " (id: ").concat(id, ")"));
        } catch (error) {
          console.error("Error processing file ".concat(filePath, ":"), error);
        }
      }
    });
  }
  try {
    processDirectory(docsDir);
    var outputPath = path.join(process.cwd(), 'static');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, {
        recursive: true
      });
    }
    var outputFilePath = path.join(outputPath, 'searchIndex.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(searchIndex, null, 2));
    console.log("Generated search index with ".concat(searchIndex.length, " documents"));
    console.log("Search index saved to: ".concat(outputFilePath));
  } catch (error) {
    console.error('Error generating search index:', error);
    process.exit(1);
  }
}
generateSearchIndex();