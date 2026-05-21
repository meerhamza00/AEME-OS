import fs from 'fs';
import path from 'path';

const replaceThemeClasses = (filePath: string) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content
    .replace(/\bbg-neutral-950\b/g, 'bg-neutral-50 dark:bg-neutral-950')
    .replace(/\bbg-neutral-900(?!\/)\b/g, 'bg-white dark:bg-neutral-900')
    .replace(/\bbg-neutral-900\/50\b/g, 'bg-neutral-100/50 dark:bg-neutral-900/50')
    .replace(/\bbg-neutral-900\/80\b/g, 'bg-white/80 dark:bg-neutral-900/80')
    .replace(/\bbg-neutral-800\/80\b/g, 'bg-neutral-200/80 dark:bg-neutral-800/80')
    .replace(/\bbg-neutral-800\/50\b/g, 'bg-neutral-200/50 dark:bg-neutral-800/50')
    .replace(/\bbg-neutral-800(?!\/)\b/g, 'bg-neutral-100 dark:bg-neutral-800')
    .replace(/\bborder-neutral-800\/50\b/g, 'border-neutral-200/50 dark:border-neutral-800/50')
    .replace(/\bborder-neutral-800\/80\b/g, 'border-neutral-200/80 dark:border-neutral-800/80')
    .replace(/\bborder-neutral-800(?!\/)\b/g, 'border-neutral-200 dark:border-neutral-800')
    .replace(/\bborder-neutral-700\b/g, 'border-neutral-300 dark:border-neutral-700')
    .replace(/\btext-neutral-200\b/g, 'text-neutral-800 dark:text-neutral-200')
    .replace(/\btext-neutral-300\b/g, 'text-neutral-700 dark:text-neutral-300')
    .replace(/\btext-neutral-400\b/g, 'text-neutral-600 dark:text-neutral-400')
    .replace(/\btext-neutral-500\b/g, 'text-neutral-500 dark:text-neutral-500')
    .replace(/\btext-white\b/g, 'text-black dark:text-white')
    .replace(/\btext-neutral-50\b/g, 'text-neutral-900 dark:text-neutral-50')
    .replace(/\btext-neutral-900\b/g, 'text-neutral-900 dark:text-neutral-100');
    
  fs.writeFileSync(filePath, content, 'utf8');
};

const dirs = ['src', 'src/components'];
dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      replaceThemeClasses(path.join(dir, file));
    }
  });
});
