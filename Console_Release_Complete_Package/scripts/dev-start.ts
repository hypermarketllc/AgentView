// scripts/dev-start.ts
import { execSync } from 'child_process';

console.log('🧪 Validating developer environment...');
execSync('ts-node scripts/dev-check.ts', { stdio: 'inherit' });

console.log('🩹 Running patches...');
execSync('ts-node tools/patch/runPatch.ts', { stdio: 'inherit' });

console.log('🐳 Starting docker (console + db)...');
execSync('docker-compose -f docker-compose.console.yml up -d', { stdio: 'inherit' });

console.log('🧠 Booting developer console interface...');
execSync('ts-node scripts/startConsole.ts', { stdio: 'inherit' });
