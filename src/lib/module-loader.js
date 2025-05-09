/**
 * module-loader.js
 * 
 * A utility module that helps with loading modules based on the environment configuration.
 * This allows scripts to dynamically use either ES modules or CommonJS based on environment settings.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Initialize dotenv
dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper function to determine if we're using ES modules
 * @returns {boolean} True if using ES modules, false for CommonJS
 */
export function isUsingESModules() {
  // Check environment variables
  if (process.env.NODE_MODULE_TYPE === 'module' || process.env.USE_ESM === 'true') {
    return true;
  }
  
  // Check package.json
  try {
    const packageJsonPath = new URL('../../package.json', import.meta.url);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.type === 'module';
  } catch (error) {
    console.warn('Could not read package.json:', error.message);
  }
  
  // Default to ES modules
  return true;
}

/**
 * Dynamically import a module based on the current module system
 * @param {string} esmPath - Path for ES modules import
 * @param {string} cjsPath - Path for CommonJS require
 * @returns {Promise<any>} The imported module
 */
export async function dynamicImport(esmPath, cjsPath) {
  if (isUsingESModules()) {
    return import(esmPath);
  } else {
    // In ESM context, we need to use dynamic import for CJS modules too
    const module = await import(cjsPath);
    return module.default || module;
  }
}

/**
 * Get the appropriate file extension for new modules
 * @returns {string} '.js' for ES modules, '.cjs' for CommonJS
 */
export function getModuleExtension() {
  return isUsingESModules() ? '.js' : '.cjs';
}

/**
 * Convert a path to use the appropriate extension
 * @param {string} path - The original path
 * @returns {string} Path with the appropriate extension
 */
export function getModulePath(path) {
  const extension = getModuleExtension();
  if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
    return path.replace(/\.(js|cjs|mjs)$/, extension);
  }
  return path + extension;
}

export default {
  isUsingESModules,
  dynamicImport,
  getModuleExtension,
  getModulePath
};
