const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dirToScan = 'c:/Findit Campus/frontend/src';

walkDir(dirToScan, function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    // Replace all occurrences of dark: followed by word characters, hyphens, slashes, brackets, hash, or colon.
    // E.g., dark:bg-on-background, dark:hover:bg-primary, dark:bg-[#123]/90
    content = content.replace(/\bdark:[A-Za-z0-9\-/\:\[\]\#]+/g, '');
    
    // Clean up multiple spaces that might have been left behind inside class strings
    content = content.replace(/ +(?=")/g, ''); // spaces before ending quote
    content = content.replace(/(?<=class(Name)?=") +/g, ''); // spaces after opening quote
    content = content.replace(/ {2,}/g, ' '); // collapse multiple spaces
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
