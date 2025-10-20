#!/usr/bin/env node

/**
 * Build script that copies files from src to lib
 * Excludes node_modules and other unnecessary files
 */

const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const libDir = path.join(__dirname, '..', 'lib');

async function build() {
  console.log('Building smart-search-plugin...');
  
  // Clean lib directory
  await fs.remove(libDir);
  
  // Copy files from src to lib, excluding node_modules
  await fs.copy(srcDir, libDir, {
    filter: (src) => {
      // Exclude node_modules
      if (src.includes('node_modules')) {
        return false;
      }
      // Exclude package-lock.json and yarn.lock
      if (src.endsWith('package-lock.json') || src.endsWith('yarn.lock')) {
        return false;
      }
      return true;
    }
  });
  
  console.log('Build complete!');
}

build().catch(console.error);