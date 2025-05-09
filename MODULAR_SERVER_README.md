# Modular Server Implementation

This document explains the modularization of the server code and the MIME type fix implemented to resolve JavaScript module loading issues.

## Overview

The original `server-docker.js` file has been split into multiple smaller modules to improve maintainability and readability. Additionally, a comprehensive MIME type handling system has been implemented to fix issues with JavaScript module loading in the browser.

## Modular Structure

The server code has been split into the following modules:

1. **server-docker-core.js**: Main server setup, middleware, and startup code
2. **server-docker-db.js**: Database initialization and connection
3. **server-docker-auth.js**: Authentication middleware and auth routes
4. **server-docker-routes.js**: API routes for deals, carriers, products, etc.
5. **server-docker-static.js**: Static file serving with proper MIME type handling
6. **server-docker-index.js**: Main entry point that imports and re-exports all components

## MIME Type Fix

The main issue with JavaScript module loading has been fixed in the `server-docker-static.js` file. The key improvements include:

1. **Comprehensive MIME Type Mapping**: Added a complete mapping of file extensions to MIME types
2. **Smart Content-Type Detection**: Implemented logic to detect JavaScript modules based on file content and path
3. **Custom Static File Server**: Created a custom static file server middleware that sets the correct Content-Type headers
4. **Special Handling for Assets**: Added special handling for files in the assets directory

## How to Use

### Running with Docker

Two scripts have been provided to build and run the Docker container with the modularized server:

- **Linux/Mac**: `./run-modular-docker.sh`
- **Windows**: `run-modular-docker.bat`

These scripts will:
1. Build a Docker image using the `Dockerfile.modular` file
2. Run a container with the modularized server
3. Make the application available at http://localhost:3001/crm

If you need to clean up Docker containers and images:

- **Linux/Mac**: `./cleanup-modular-docker.sh`
- **Windows**: `cleanup-modular-docker.bat`

These cleanup scripts will:
1. Stop the running container (if any)
2. Remove the container (if it exists)
3. Remove the Docker image (if it exists)

### Running Locally

Two scripts have been provided to run the modularized server locally without Docker:

- **Linux/Mac**: `./run-modular-server.sh`
- **Windows**: `run-modular-server.bat`

These scripts will start the server locally using Node.js, making the application available at http://localhost:3000/crm.

Alternatively, you can run the server directly:

```bash
node server-docker-index.js
```

or

```bash
node run-modular-server.js
```

## Backward Compatibility

The modularized server maintains full backward compatibility with the original `server-docker.js`. The `server-docker-index.js` file serves as a drop-in replacement for the original file.

## Troubleshooting

If you encounter any issues with the modularized server:

1. **Check Logs**: Use `docker logs myagentview-modular-container` to view server logs
2. **Verify MIME Types**: Check the browser's network tab to ensure JavaScript files are being served with the correct MIME type
3. **Module Detection**: If modules are still not loading correctly, check if they contain import/export statements or are in the assets directory
4. **Port Conflicts**: If you get a port conflict error when running Docker, the scripts now use port 3001 instead of 3000
5. **Database Connection**: The server will now start even if the database connection fails, with appropriate warnings

### Common Issues and Solutions

#### Port Already in Use

If you see an error like "listen tcp 0.0.0.0:3001: bind: Only one usage of each socket address (protocol/network address/port) is normally permitted", you can:

1. Stop any other containers or services using that port:
   ```bash
   docker ps
   docker stop <container_id>
   ```

2. Or modify the port mapping in the run scripts to use a different port:
   ```bash
   # In run-modular-docker.sh or run-modular-docker.bat
   # Change -p 3001:3000 to -p 3002:3000
   ```

#### Database Connection Errors

If you see "Database initialization error: Error: getaddrinfo ENOTFOUND db", this means:

1. When running locally, the server is trying to connect to a database host named "db" which only exists in Docker
2. The server will continue to run, but database features won't work
3. To fix this, ensure you have a PostgreSQL database running locally and update the .env file with the correct connection details

## Future Improvements

Potential future improvements include:

1. **Configuration File**: Move configuration options to a separate file
2. **Enhanced Logging**: Add more detailed logging for debugging
3. **Additional MIME Types**: Expand the MIME type mapping as needed
4. **Caching Headers**: Add proper caching headers for static files
