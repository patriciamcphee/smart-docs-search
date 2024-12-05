const fs = require('fs');
const path = require('path');

// This function copies a single file from source to target
function copyFileSync(source, target) {
    // If the target is a directory, append the source filename
    let targetFile = target;
    if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
    }

    // Read and write the file contents
    fs.writeFileSync(targetFile, fs.readFileSync(source));
    console.log(`Copied: ${source} → ${targetFile}`);
}

// This function recursively copies a directory
function copyFolderRecursiveSync(source, target) {
    // Create the target directory if it doesn't exist
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
        console.log(`Created directory: ${target}`);
    }

    // Only proceed if source is a directory
    if (fs.lstatSync(source).isDirectory()) {
        // Read all files/folders in the source directory
        const files = fs.readdirSync(source);
        
        files.forEach(function(file) {
            const currentSource = path.join(source, file);
            const currentTarget = path.join(target, file);
            
            if (fs.lstatSync(currentSource).isDirectory()) {
                // Recursively copy subdirectories
                copyFolderRecursiveSync(currentSource, currentTarget);
            } else {
                // Only copy CSS and JSON files
                if (file.endsWith('.css') || file.endsWith('.json')) {
                    copyFileSync(currentSource, currentTarget);
                }
            }
        });
    }
}

// Main execution
console.log('Starting file copy process...');

// Define source and target directories
const srcDir = path.join(__dirname, '..', 'src');
const libDir = path.join(__dirname, '..', 'lib');

try {
    // Copy files from src to lib
    console.log(`Copying files from ${srcDir} to ${libDir}`);
    copyFolderRecursiveSync(srcDir, libDir);
    console.log('File copy process completed successfully');
} catch (error) {
    console.error('Error during file copy process:', error);
    process.exit(1);
}