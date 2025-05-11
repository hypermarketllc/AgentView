/**
 * Core functionality for the auth provider fix
 * This module provides shared utilities and constants
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the frontend dist directory
const distPath = path.join(__dirname, '..', '..', 'dist');
const indexJsPath = path.join(distPath, 'assets', 'index.Ca7GziYn.js');
const indexHtmlPath = path.join(distPath, 'index.html');

// Export paths and utilities
export {
  fs,
  path,
  distPath,
  indexJsPath,
  indexHtmlPath
};
