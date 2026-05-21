const fs = require('fs');
const path = require('path');

const files = [
  'src/components/SimulationEngine.tsx',
  'src/components/PPCEngine.tsx',
  'src/components/StrategicChat.tsx',
  'src/components/AutonomyControlPlane.tsx',
  'src/components/AnalyticsEngine.tsx',
  'src/components/MemoryEngine.tsx',
  'src/components/GovernanceLayer.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/bg-indigo-[56]00/g, 'bg-[#007AFF]');
    content = content.replace(/text-indigo-[45]00/g, 'text-[#007AFF]');
    content = content.replace(/hover:bg-indigo-[56]00/g, 'hover:bg-[#005bb5]');
    content = content.replace(/ring-indigo-500/g, 'ring-[#007AFF]');
    content = content.replace(/bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/g, 'bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10');
    content = content.replace(/bg-neutral-100 dark:bg-neutral-800/g, 'bg-black/5 dark:bg-white/10');
    content = content.replace(/bg-neutral-50 dark:bg-neutral-900/g, 'bg-black/5 dark:bg-white/5');
    content = content.replace(/border-neutral-200 dark:border-neutral-800/g, 'border-black/5 dark:border-white/10');
    content = content.replace(/border-neutral-200\/80 dark:border-neutral-800\/80/g, 'border-black/5 dark:border-white/10');
    
    fs.writeFileSync(file, content, 'utf8');
  }
});
