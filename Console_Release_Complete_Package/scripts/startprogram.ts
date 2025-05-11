import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the absolute root project path
const rootDir = path.resolve(__dirname, '../../');
console.log('🚀 Starting Console Program');

// Start the backend program using npm run start, fallback-safe
exec('ts-node', { cwd: rootDir }, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ Failed to start program using npm:', err.message);
    console.error('💡 Make sure npm is installed and available in PATH');
    return;
  }
  console.log('✅ Program started via npm run start');
  console.log(stdout);
  if (stderr) console.warn(stderr);
});