const fs = require('fs');

function replaceClasses(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-surface\/80 dark:bg-surface-container-low\/95/g, 'bg-surface/80 dark:bg-inverse-surface/90');
  content = content.replace(/bg-surface /g, 'bg-surface dark:bg-on-background ');
  content = content.replace(/bg-surface"/g, 'bg-surface dark:bg-on-background"');
  content = content.replace(/bg-surface-container-low /g, 'bg-surface-container-low dark:bg-inverse-surface ');
  content = content.replace(/bg-surface-container-low"/g, 'bg-surface-container-low dark:bg-inverse-surface"');
  content = content.replace(/text-on-surface /g, 'text-on-surface dark:text-surface ');
  content = content.replace(/text-on-surface"/g, 'text-on-surface dark:text-surface"');
  content = content.replace(/bg-surface-container /g, 'bg-surface-container dark:bg-inverse-surface/50 ');
  content = content.replace(/bg-surface-container"/g, 'bg-surface-container dark:bg-inverse-surface/50"');
  content = content.replace(/text-on-surface-variant /g, 'text-on-surface-variant dark:text-surface-variant ');
  content = content.replace(/text-on-surface-variant"/g, 'text-on-surface-variant dark:text-surface-variant"');
  content = content.replace(/bg-surface-container-lowest/g, 'bg-surface-container-lowest dark:bg-on-background');
  content = content.replace(/border-outline-variant\/30/g, 'border-outline-variant/30 dark:border-outline/30');
  content = content.replace(/border-outline-variant\/60/g, 'border-outline-variant/60 dark:border-outline/60');
  fs.writeFileSync(file, content);
}

replaceClasses('c:/Findit Campus/frontend/src/pages/Home.jsx');
replaceClasses('c:/Findit Campus/frontend/src/components/Footer.jsx');
replaceClasses('c:/Findit Campus/frontend/src/components/AiMatchSimulator.jsx');

console.log('Fixed classes');
