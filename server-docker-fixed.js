/**
 * Server Docker Fixed
 * Enhanced server with API routes for system health checks, user accounts, and settings
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerApiRoutes } from './src/config/api-registry.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Register API routes
registerApiRoutes(app);

// Default route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
