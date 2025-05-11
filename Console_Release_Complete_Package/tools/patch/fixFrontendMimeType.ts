import fs from 'fs';
import path from 'path';

export function fixFrontendMimeType() {
  const serverPath = path.resolve(__dirname, '../../server.ts');

  if (!fs.existsSync(serverPath)) {
    throw new Error('Cannot locate server.ts. Expected at ../../server.ts');
  }

  const content = fs.readFileSync(serverPath, 'utf-8');

  const hasStatic = content.includes('express.static');
  const hasSendFile = content.includes('res.sendFile');
const hasExtensionCheck = content.includes("req.path.includes('.')") || content.includes("path.extname(");


  if (!hasStatic) {
    throw new Error('Server is missing express.static middleware. Static frontend files may not be served.');
  }

  if (hasSendFile && !hasExtensionCheck) {
    throw new Error('res.sendFile fallback detected without extension guard. May intercept JS module requests.');
  }

  console.log('✅ Frontend MIME configuration looks OK.');
}