const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));
files.push('src/App.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace remaining solid backgrounds with glass ones
  content = content.replace(/bg-white dark:bg-neutral-900/g, 'bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl');
  content = content.replace(/bg-neutral-50 dark:bg-neutral-950/g, 'bg-white/30 dark:bg-black/30 backdrop-blur-3xl');
  content = content.replace(/bg-neutral-100\/50 dark:bg-neutral-900\/50/g, 'bg-black/5 dark:bg-white/5 backdrop-blur-md');
  content = content.replace(/border-neutral-200\/50 dark:border-neutral-800\/50/g, 'border-black/5 dark:border-white/10');
  content = content.replace(/border-neutral-200 dark:border-neutral-800/g, 'border-black/5 dark:border-white/10');
  
  // Replace generic "text-white" on buttons that should be white even in light mode
  // But wait, my previous command changed text-black dark:text-white to text-white. That's fine for colored buttons.
  
  fs.writeFileSync(file, content, 'utf8');
});
