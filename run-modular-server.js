/**
 * run-modular-server.js
 * Script to run the modular server locally for development and testing
 */

import { start } from './server-docker-index.js';

console.log('Starting modular server locally...');
console.log('Press Ctrl+C to stop the server');

// Start the server
start();
