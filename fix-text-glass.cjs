const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace erroneous text-white on headings with responsive text colors
  content = content.replace(/className="([^"]*)text-white([^"]*)"/g, (match, p1, p2) => {
    // If it's a button (has bg-[#007AFF] or similar blue/red/green solid color), keep text-white
    if (p1.includes('bg-indigo') || p1.includes('bg-[#007AFF]') || p1.includes('bg-[#005bb5]') ||
        p1.includes('bg-purple') || p1.includes('bg-emerald') || p1.includes('bg-rose') || p1.includes('bg-orange') ||
        p2.includes('bg-indigo') || p2.includes('bg-[#007AFF]') ||
        p1.includes('text-white bg-black/5') || // specific badge in StrategicChat
        p1.includes('bg-cyan') || p1.includes('bg-teal')) {
      return match;
    }
    // For anything else, change to text-neutral-900 dark:text-white
    return `className="${p1}text-neutral-900 dark:text-white${p2}"`;
  });
  
  // Clean up
  content = content.replace(/text-neutral-900 dark:text-white text-neutral-900 dark:text-white/g, 'text-neutral-900 dark:text-white');
  content = content.replace(/text-black dark:text-white/g, 'text-neutral-900 dark:text-white');

  fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));
files.push('src/App.tsx');

files.forEach(processFile);
