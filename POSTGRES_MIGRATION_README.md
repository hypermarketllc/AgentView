# PostgreSQL Migration Guide

This guide explains how to migrate your application from Supabase to PostgreSQL using the provided scripts.

## Quick Start

To run the application with PostgreSQL:

```bash
node run-postgres.js
```

This single command will:
1. Set up the necessary environment variables
2. Start PostgreSQL in Docker
3. Create the database and import schema/data if needed
4. Run the application with the PostgreSQL adapter

> **Note**: All scripts are ES modules. Make sure to run them with Node.js version 14 or higher.

## Troubleshooting

If you encounter issues with the PostgreSQL container, you can clean up and start fresh:

```bash
node cleanup-postgres.js
```

This will:
1. Stop the PostgreSQL container
2. Remove the container
3. Remove the associated volume
4. Allow you to start fresh with `node run-postgres.js`

## How It Works

The migration solution consists of these key components:

1. **run-postgres.js**: A cross-platform entry point that works on both Windows and Unix-like systems.

2. **run-postgres-all.mjs**: The main script that handles:
   - Environment setup
   - PostgreSQL container management
   - Database initialization
   - Application execution

3. **cleanup-postgres.js**: A utility to clean up the PostgreSQL container and volume.

4. **docker-compose.postgres.yml**: Docker Compose configuration for PostgreSQL.

## Detailed Logs

The script creates detailed log files in the project directory with names like:
```
postgres-migration-2025-05-07T08-59-05-836Z.log
```

These logs contain comprehensive information about each step of the process and are invaluable for troubleshooting.

## Common Issues and Solutions

### Container Restarting

If the PostgreSQL container keeps restarting:

1. Run the cleanup script:
   ```bash
   node cleanup-postgres.js
   ```

2. Check Docker logs for specific errors:
   ```bash
   docker logs agentview-postgres
   ```

3. Try running the application again:
   ```bash
   node run-postgres.js
   ```

### Permission Issues

If you see permission errors in the logs, the script will automatically attempt to fix them by running the container as root. If this doesn't work, you can manually modify the `docker-compose.postgres.yml` file to add:

```yaml
user: "root"
```

### Port Conflicts

If port 5432 is already in use, you can modify the `docker-compose.postgres.yml` file to use a different port:

```yaml
ports:
  - "5433:5432"  # Change 5432 to another port
```

Then update the `.env.postgres` file to use the same port:

```
POSTGRES_PORT=5433
```

## Advanced Usage

For advanced users who want to run specific parts of the process:

1. **Start PostgreSQL only**:
   ```bash
   docker-compose -f docker-compose.postgres.yml up -d
   ```

2. **Check PostgreSQL connection**:
   ```bash
   node check-db-connection.js
   ```

3. **Run the application with PostgreSQL**:
   ```bash
   node run-fixed-postgres-docker.js
   ```
