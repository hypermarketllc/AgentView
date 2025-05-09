/**
 * robust-patch.js
 * 
 * A comprehensive patch to fix common issues and provide robust solutions for:
 * - MIME type handling for JavaScript modules
 * - UUID validation and generation
 * - Environment detection and configuration
 * - Database connection handling
 * - Error recovery mechanisms
 */

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Comprehensive MIME type mapping
 * Ensures all file types are served with the correct Content-Type headers
 */
export const mimeTypes = {
  // HTML
  '.html': 'text/html',
  '.htm': 'text/html',
  
  // JavaScript - All JavaScript files use application/javascript for better module compatibility
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.cjs': 'application/javascript',
  '.jsx': 'application/javascript',
  '.ts': 'application/javascript',
  '.tsx': 'application/javascript',
  '.module.js': 'application/javascript',
  '.esm.js': 'application/javascript',
  
  // CSS
  '.css': 'text/css',
  
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  
  // JSON and data formats
  '.json': 'application/json',
  '.jsonld': 'application/ld+json',
  '.map': 'application/json',
  
  // XML
  '.xml': 'application/xml',
  '.rss': 'application/rss+xml',
  '.atom': 'application/atom+xml',
  
  // Text
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Archives
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  
  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  
  // Web manifest
  '.webmanifest': 'application/manifest+json',
  
  // Other
  '.wasm': 'application/wasm',
  '.swf': 'application/x-shockwave-flash'
};

/**
 * Enhanced MIME type detection
 * Determines the correct MIME type for a file based on extension, content, and context
 * @param {string} filePath - Path to the file
 * @returns {string} - The appropriate MIME type
 */
export function getMimeType(filePath) {
  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  
  // Special case for JavaScript files
  if (['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'].includes(ext)) {
    try {
      // Check if file exists before trying to read it
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for module indicators in content
        const isModule = content.includes('import ') || 
                         content.includes('export ') || 
                         content.includes('from ') ||
                         content.includes('as ') ||
                         content.includes('import(');
        
        // Check for module indicators in path
        const isInModulePath = filePath.includes('/assets/') || 
                              filePath.includes('\\assets\\') ||
                              filePath.includes('/dist/') ||
                              filePath.includes('\\dist\\') ||
                              filePath.includes('/node_modules/') ||
                              filePath.includes('\\node_modules\\');
        
        // Always return application/javascript for better compatibility
        return 'application/javascript';
      }
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
    }
  }
  
  // Return the MIME type from our mapping, or a default
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * UUID validation and generation
 * Provides utilities for working with UUIDs safely
 */
export const uuidUtils = {
  /**
   * Validates a UUID string
   * @param {string} uuid - The UUID to validate
   * @returns {boolean} - Whether the UUID is valid
   */
  isValid: (uuid) => {
    try {
      return uuidValidate(uuid);
    } catch (err) {
      return false;
    }
  },
  
  /**
   * Generates a new valid UUID
   * @returns {string} - A new UUID
   */
  generate: () => {
    return uuidv4();
  },
  
  /**
   * Safely gets a UUID, either validating the provided one or generating a new one
   * @param {string} [uuid] - Optional UUID to validate
   * @returns {string} - A valid UUID (either the provided one if valid, or a new one)
   */
  safe: (uuid) => {
    if (uuid && uuidUtils.isValid(uuid)) {
      return uuid;
    }
    return uuidUtils.generate();
  }
};

/**
 * Environment detection and configuration
 * Provides utilities for detecting and configuring the environment
 */
export const envUtils = {
  /**
   * Detects if the application is running in Docker
   * @returns {boolean} - Whether the application is running in Docker
   */
  isDocker: () => {
    // Check for explicit environment variable
    if (process.env.RUNNING_IN_DOCKER === 'true') {
      return true;
    }
    
    // Check for Docker-specific files
    try {
      return fs.existsSync('/.dockerenv') || fs.existsSync('/proc/1/cgroup') && 
             fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker');
    } catch (err) {
      return false;
    }
  },
  
  /**
   * Gets the appropriate database host based on the environment
   * @returns {string} - The database host
   */
  getDatabaseHost: () => {
    if (envUtils.isDocker()) {
      return process.env.POSTGRES_HOST || 'db';
    }
    return process.env.POSTGRES_HOST || 'localhost';
  },
  
  /**
   * Gets the appropriate database port based on the environment
   * @returns {number} - The database port
   */
  getDatabasePort: () => {
    return parseInt(process.env.POSTGRES_PORT || '5432');
  },
  
  /**
   * Gets the appropriate database name based on the environment
   * @returns {string} - The database name
   */
  getDatabaseName: () => {
    return process.env.POSTGRES_DB || 'crm_db';
  },
  
  /**
   * Gets the appropriate database user based on the environment
   * @returns {string} - The database user
   */
  getDatabaseUser: () => {
    return process.env.POSTGRES_USER || 'crm_user';
  },
  
  /**
   * Gets the appropriate database password based on the environment
   * @returns {string} - The database password
   */
  getDatabasePassword: () => {
    return process.env.POSTGRES_PASSWORD || 'your_strong_password_here';
  },
  
  /**
   * Gets the database connection configuration
   * @returns {Object} - The database connection configuration
   */
  getDatabaseConfig: () => {
    return {
      host: envUtils.getDatabaseHost(),
      port: envUtils.getDatabasePort(),
      database: envUtils.getDatabaseName(),
      user: envUtils.getDatabaseUser(),
      password: envUtils.getDatabasePassword()
    };
  }
};

/**
 * Database utilities
 * Provides utilities for working with databases safely
 */
export const dbUtils = {
  /**
   * Tests a database connection
   * @param {Object} pool - The database connection pool
   * @returns {Promise<boolean>} - Whether the connection is successful
   */
  testConnection: async (pool) => {
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('Database connected:', res.rows[0]);
      return true;
    } catch (err) {
      console.error('Database connection error:', err);
      return false;
    }
  },
  
  /**
   * Safely executes a database query with error handling
   * @param {Object} pool - The database connection pool
   * @param {string} query - The SQL query to execute
   * @param {Array} [params] - Optional parameters for the query
   * @returns {Promise<Object>} - The query result or null if error
   */
  safeQuery: async (pool, query, params = []) => {
    try {
      return await pool.query(query, params);
    } catch (err) {
      console.error('Database query error:', err);
      return null;
    }
  },
  
  /**
   * Safely inserts data with UUID validation
   * @param {Object} pool - The database connection pool
   * @param {string} table - The table to insert into
   * @param {Object} data - The data to insert
   * @returns {Promise<Object>} - The insert result or null if error
   */
  safeInsert: async (pool, table, data) => {
    // Validate and fix UUIDs in the data
    for (const key in data) {
      if (key === 'id' || key.endsWith('_id')) {
        data[key] = uuidUtils.safe(data[key]);
      }
    }
    
    // Build the query
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(data);
    
    // Execute the query
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    return await dbUtils.safeQuery(pool, query, values);
  }
};

/**
 * Error handling and recovery
 * Provides utilities for handling errors and recovering from them
 */
export const errorUtils = {
  /**
   * Wraps a function with error handling
   * @param {Function} fn - The function to wrap
   * @param {*} defaultValue - The default value to return if the function throws
   * @returns {Function} - The wrapped function
   */
  withErrorHandling: (fn, defaultValue = null) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (err) {
        console.error('Error in function:', err);
        return defaultValue;
      }
    };
  },
  
  /**
   * Retries a function multiple times with exponential backoff
   * @param {Function} fn - The function to retry
   * @param {number} [maxRetries=3] - The maximum number of retries
   * @param {number} [initialDelay=1000] - The initial delay in milliseconds
   * @returns {Function} - The wrapped function
   */
  withRetry: (fn, maxRetries = 3, initialDelay = 1000) => {
    return async (...args) => {
      let lastError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (err) {
          console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, err);
          lastError = err;
          
          if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError;
    };
  }
};

/**
 * File system utilities
 * Provides utilities for working with files safely
 */
export const fsUtils = {
  /**
   * Safely reads a file with error handling
   * @param {string} filePath - The path to the file
   * @param {string} [encoding='utf8'] - The encoding to use
   * @returns {string|null} - The file content or null if error
   */
  safeReadFile: (filePath, encoding = 'utf8') => {
    try {
      return fs.readFileSync(filePath, encoding);
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return null;
    }
  },
  
  /**
   * Safely writes a file with error handling
   * @param {string} filePath - The path to the file
   * @param {string} content - The content to write
   * @param {string} [encoding='utf8'] - The encoding to use
   * @returns {boolean} - Whether the write was successful
   */
  safeWriteFile: (filePath, content, encoding = 'utf8') => {
    try {
      // Ensure the directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, encoding);
      return true;
    } catch (err) {
      console.error(`Error writing file ${filePath}:`, err);
      return false;
    }
  }
};

// Export all utilities
export default {
  mimeTypes,
  getMimeType,
  uuidUtils,
  envUtils,
  dbUtils,
  errorUtils,
  fsUtils
};
