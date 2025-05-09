/**
 * server-docker-static.js
 * Static file serving with proper MIME type handling for the Docker environment
 */

import express from 'express';
import robustPatch, { mimeTypes, getMimeType, fsUtils } from './robust-patch.js';
import path from 'path';
import fs from 'fs';

// Using mimeTypes and getMimeType from robust-patch.js

/**
 * Custom static file server middleware with proper MIME type handling
 * @param {string} dirPath - Directory path to serve files from
 * @returns {Function} - Express middleware function
 */
function createStaticFileServer(dirPath) {
  return (req, res, next) => {
    // Get the file path
    const filePath = path.join(dirPath, req.path);
    
    // Check if file exists
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return next(); // Pass to next middleware if file doesn't exist
      }
      
      // Set the correct Content-Type header
      const mimeType = getMimeType(filePath);
      res.setHeader('Content-Type', mimeType);
      
      // Stream the file
      fs.createReadStream(filePath).pipe(res);
    });
  };
}

/**
 * Setup static file serving for the application
 * @param {Object} app - Express application
 * @param {string} rootDir - Root directory of the application
 * @param {string} indexHtml - HTML content for the index page
 */
function setupStaticFiles(app, rootDir, indexHtml) {
  // Serve static files from the dist/assets directory with proper MIME types
  app.use('/crm/assets', (req, res, next) => {
    const assetsPath = path.join(rootDir, 'dist', 'assets');
    const filePath = path.join(assetsPath, req.path);
    
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return next();
      }
      
      // Set the correct Content-Type header
      const mimeType = getMimeType(filePath);
      res.setHeader('Content-Type', mimeType);
      
      // Stream the file
      fs.createReadStream(filePath).pipe(res);
    });
  });
  
  // Fallback for other static files in dist
  app.use('/crm', createStaticFileServer(path.join(rootDir, 'dist')));
  
  // Serve index.html for all other routes under /crm
  app.get('/crm*', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(indexHtml);
  });
}

// Export the setup function and utilities
export { setupStaticFiles, getMimeType, mimeTypes };
