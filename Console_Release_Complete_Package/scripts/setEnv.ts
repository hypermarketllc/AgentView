import fs from 'fs';

const mode = process.argv[2];
const envMap = {
  local: '.env.local',
  docker: '.env.docker',
  prod: '.env.production'
};

fs.copyFileSync(envMap[mode], '.env');
console.log(`🔁 Switched to ${mode} env`);