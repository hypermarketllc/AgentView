# PostgreSQL Module Configuration Guide

This document provides information about the module system configuration for the PostgreSQL migration and how to use the provided scripts to check your PostgreSQL connection and authentication.

## Environment Variables

The following environment variables have been added to the `.env` file to control the module system and port configurations:

```
# Module System Configuration
NODE_MODULE_TYPE=module
USE_ESM=true

# Additional Port Configurations
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_DOCKER_PORT=5432
NGINX_PORT=8080
DEV_SERVER_PORT=5173
```

### Module System Variables

- `NODE_MODULE_TYPE`: Set to `module` to use ES modules or `commonjs` to use CommonJS.
- `USE_ESM`: Set to `true` to use ES modules or `false` to use CommonJS.

These variables are used by the module loader utility to determine which module system to use.

### Port Configuration Variables

- `FRONTEND_PORT`: The port for the frontend application (default: 3000).
- `BACKEND_PORT`: The port for the backend API server (default: 3001).
- `POSTGRES_DOCKER_PORT`: The port for the PostgreSQL Docker container (default: 5432).
- `NGINX_PORT`: The port for the NGINX server (default: 8080).
- `DEV_SERVER_PORT`: The port for the development server (default: 5173).

## Module Loader Utility

A new utility module has been created at `src/lib/module-loader.js` to help with loading modules based on the environment configuration. This utility provides the following functions:

- `isUsingESModules()`: Returns `true` if using ES modules, `false` for CommonJS.
- `dynamicImport(esmPath, cjsPath)`: Dynamically imports a module based on the current module system.
- `getModuleExtension()`: Returns the appropriate file extension for new modules (`.js` for ES modules, `.cjs` for CommonJS).
- `getModulePath(path)`: Converts a path to use the appropriate extension.

## PostgreSQL Check Scripts

New scripts have been created to check the PostgreSQL connection and authentication:

### JavaScript Script

- `run-postgres-check.js`: The main JavaScript script that runs the PostgreSQL connection and authentication checks.

### Batch Script (Windows)

- `run-postgres-check.bat`: A batch script for Windows that runs the PostgreSQL checks.

### Shell Script (Unix-like)

- `run-postgres-check.sh`: A shell script for Unix-like systems that runs the PostgreSQL checks.

## Usage

### Running the PostgreSQL Checks

#### Windows

```
run-postgres-check.bat [options]
```

#### Unix-like Systems

```
./run-postgres-check.sh [options]
```

### Options

- `--all` or `-a`: Run all checks (connection and authentication).
- `--connection` or `-c`: Run only the connection check.
- `--auth` or `-u`: Run only the authentication check.

If no options are provided, only the connection check will be run.

## Examples

### Run All Checks

#### Windows

```
run-postgres-check.bat --all
```

#### Unix-like Systems

```
./run-postgres-check.sh --all
```

### Run Only Connection Check

#### Windows

```
run-postgres-check.bat --connection
```

#### Unix-like Systems

```
./run-postgres-check.sh --connection
```

### Run Only Authentication Check

#### Windows

```
run-postgres-check.bat --auth
```

#### Unix-like Systems

```
./run-postgres-check.sh --auth
```

## Troubleshooting

If you encounter any issues with the PostgreSQL checks, please check the following:

1. Make sure PostgreSQL is running.
2. Check your database credentials in the `.env` file.
3. Ensure the database schema is properly set up.
4. Refer to `POSTGRES_MIGRATION_DOCUMENTATION.md` for more information.

## Module System Compatibility

The scripts and utilities in this project are designed to work with both ES modules and CommonJS. The module system is determined by the following factors, in order of precedence:

1. The `NODE_MODULE_TYPE` environment variable.
2. The `USE_ESM` environment variable.
3. The `type` field in `package.json`.

If none of these are set, the default is to use ES modules.
