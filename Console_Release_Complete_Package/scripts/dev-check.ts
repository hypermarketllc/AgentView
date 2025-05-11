import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log('🔍 Loaded .env DB_URL:', process.env.DB_URL || '[undefined]');

const checks = [
  {
    label: 'DB_URL environment variable',
    test: () => !!process.env.DB_URL
  },
  {
    label: '.env file presence',
    test: () => fs.existsSync(envPath)
  },
  {
    label: 'logs/ directory presence',
    test: () => {
      const logsPath = path.resolve(__dirname, '../../logs');
      if (!fs.existsSync(logsPath)) {
        console.warn('⚠️ logs/ directory missing — creating it now...');
        fs.mkdirSync(logsPath, { recursive: true });
      }
      return fs.existsSync(logsPath);
    }
  }
];

let allPassed = true;

checks.forEach((check, i) => {
  if (!check.test()) {
    console.error(`❌ Check ${i} failed: ${check.label}`);
    allPassed = false;
  } else {
    console.log(`✅ Check ${i} passed: ${check.label}`);
  }
});

if (!allPassed) {
  throw new Error('One or more checks failed. See above for details.');
} else {
  console.log('✅ All system checks passed.');
}