/**
 * fix-database-connection.js
 * This script fixes the database connection configuration to use the correct credentials.
 */

import { envUtils } from './robust-patch.js';

// Override the getDatabaseUser function to use the correct user from .env
const originalGetDatabaseUser = envUtils.getDatabaseUser;
envUtils.getDatabaseUser = () => {
  return process.env.POSTGRES_USER || 'postgres';
};

// Override the getDatabaseName function to use the correct database from .env
const originalGetDatabaseName = envUtils.getDatabaseName;
envUtils.getDatabaseName = () => {
  return process.env.POSTGRES_DB || 'agentview';
};

console.log('Database connection configuration fixed:');
console.log('- User:', envUtils.getDatabaseUser());
console.log('- Database:', envUtils.getDatabaseName());
console.log('- Host:', envUtils.getDatabaseHost());
console.log('- Port:', envUtils.getDatabasePort());

export { envUtils };
