#!/usr/bin/env node

/**
 * Simple build script to copy files from src to lib
 * This avoids complex build tooling while maintaining package structure
 */

const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const libDir = path.join(__dirname, '..', 'lib');

async function build() {
  console.log('Building smart-search-plugin...');
  
  // Clean lib directory
  await fs.remove(libDir);
  
  // Copy all files from src to lib
  await fs.copy(srcDir, libDir);
  
  console.log('Build complete!');
}

build().catch(console.error);