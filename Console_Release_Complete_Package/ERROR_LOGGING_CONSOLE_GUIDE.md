# Error Logging Console System Guide

## Overview

The Error Logging Console System is a comprehensive monitoring and management tool for the MyAgentView CRM application. It provides real-time error logging, system status monitoring, and administrative tools to help maintain and troubleshoot the application.

## Features

- **Error Logging**: Captures and stores application errors in a database for later review
- **System Status Monitoring**: Provides real-time status of all system components
- **Patch Management**: Apply system patches and fixes through the web interface
- **Console Dashboard**: Web-based interface for monitoring and managing the application

## Getting Started

### Prerequisites

- Docker and docker-compose installed
- Basic knowledge of Docker and web applications

### Installation

1. Navigate to the Console_Release_Complete_Package directory:
   ```
   cd Console_Release_Complete_Package
   ```

2. Run the fixed Docker script to start the system:
   - On Windows:
     ```
     run_docker_with_error_logging_fixed.bat
     ```
   - On Linux/Mac:
     ```
     chmod +x run_docker_with_error_logging_fixed.sh
     ./run_docker_with_error_logging_fixed.sh
     ```

3. Wait for the containers to start and initialize. The script will:
   - Remove any existing containers with conflicting names
   - Create necessary directories
   - Build and start the Docker containers
   - Apply the system_errors table to the database
   - Run the patch system

4. Access the Console Dashboard at:
   ```
   http://localhost:3000/console
   ```

## Using the Console Dashboard

The Console Dashboard provides several tabs for different functionality:

### Start Tab

The Start tab provides:
- System information (version, environment, etc.)
- Quick actions (run patches, refresh dashboard)
- A button to launch the main CRM frontend

### Logs Tab

The Logs tab will provide real-time server logs in a future update.

### Errors Tab

The Errors tab will provide a list of system errors from the database in a future update.

### Patch Tab

The Patch tab will provide patch management functionality in a future update.

## System Status

The system status panel on the right side of the dashboard shows:
- Overall system status
- Status of individual components:
  - Database
  - API
  - Frontend
  - Routes
  - Environment

Each component has a status indicator:
- Green: Healthy
- Red: Error

## API Endpoints

The Console System provides several API endpoints:

- `/api/health`: Check API health
- `/api/console/status`: Get system status
- `/api/console/patch`: Run system patches
- `/api/console/patch/log`: Get patch log
- `/api/errors`: Get system errors

## Troubleshooting

### Container Name Conflicts

If you encounter container name conflicts when starting the system, use the fixed scripts:
- `run_docker_with_error_logging_fixed.bat` (Windows)
- `run_docker_with_error_logging_fixed.sh` (Linux/Mac)

These scripts automatically remove existing containers with conflicting names before starting new ones.

### Database Connection Issues

If the database status shows an error:
1. Check if the database container is running:
   ```
   docker ps | grep crm-db
   ```
2. Check the database logs:
   ```
   docker-compose -f docker-compose.error-logging.yml logs crm-db
   ```

### Frontend Issues

If the frontend is not loading:
1. Check if the app container is running:
   ```
   docker ps | grep crm-app-with-error-logging
   ```
2. Check the app logs:
   ```
   docker-compose -f docker-compose.error-logging.yml logs app
   ```

## Stopping the System

PS F:\agentview\AgentView> docker logs crm-app-with-error-logging                                                                    
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58
initLogSocketServer(server);
^

ReferenceError: initLogSocketServer is not defined
    at Object.<anonymous> (/app/Console_Release_Complete_Package/run_server_with_error_logging.fixed.js:58:1)
    at Module._compile (node:internal/modules/cjs/loader:1198:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1252:10)
    at Module.load (node:internal/modules/cjs/loader:1076:32)
    at Function.Module._load (node:internal/modules/cjs/loader:911:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:22:47
PS F:\agentview\AgentView> To stop the system:
```
docker-compose -f docker-compose.error-logging.yml down
```

## Additional Information

- The system uses PostgreSQL for the database
- Error logs are stored in the `system_errors` table
- The Console Dashboard is built with React
