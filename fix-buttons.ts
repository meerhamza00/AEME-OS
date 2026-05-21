import fs from 'fs';

const files = [
  'src/components/SimulationEngine.tsx',
  'src/components/PPCEngine.tsx',
  'src/components/StrategicChat.tsx',
  'src/components/AutonomyControlPlane.tsx',
  'src/components/AnalyticsEngine.tsx',
  'src/components/MemoryEngine.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-black dark:text-white/g, 'text-white');
  fs.writeFileSync(file, content, 'utf8');
});
