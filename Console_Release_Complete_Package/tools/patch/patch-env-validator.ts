import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the root of the project
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

export function patchEnvValidator(): void {
  const required = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
  const missing = required.filter(k => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment variables validated');
}
