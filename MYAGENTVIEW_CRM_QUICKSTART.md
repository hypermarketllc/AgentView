# MyAgentView CRM - Quick Start Guide

This guide provides quick instructions for running the MyAgentView CRM system in different environments.

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+) or Docker
- Git

## Environment Setup

Create one of these environment files based on your deployment:

- `.env.local` - Local development
- `.env.docker` - Docker development
- `.env.production` - Production deployment
- `.env.postgres` - PostgreSQL specific settings

## Running Options

### 1. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. PostgreSQL Server

```bash
# Run with PostgreSQL
npm run postgres

# Run PostgreSQL with module fix
npm run postgres-module-fix
```

### 3. Docker Deployment

#### Local Docker

```bash
# Unix/macOS
chmod +x run-local.sh
./run-local.sh start

# Windows
run-local.bat start
```

#### Production Docker

```bash
# Unix/macOS
chmod +x run-prod.sh
./run-prod.sh start

# Windows
run-prod.bat start
```

### 4. PostgreSQL Docker

```bash
# Unix/macOS
chmod +x run-postgres-docker.sh
./run-postgres-docker.sh

# Windows
run-postgres-docker.bat
```

### 5. PostgreSQL Connection Check

```bash
# Unix/macOS
chmod +x run-postgres-check.sh
./run-postgres-check.sh [--all|--connection|--auth]

# Windows
run-postgres-check.bat [--all|--connection|--auth]
```

### 6. Error Logging Server

```bash
# Unix/macOS
cd Console_Release_Complete_Package
chmod +x run_docker_with_error_logging.sh
./run_docker_with_error_logging.sh

# Windows
cd Console_Release_Complete_Package
run_server_with_error_logging.bat
```

## Database Migration

```bash
# Create tables
psql -U your_user -d your_database -f supabase-export/create_tables.sql

# Import data
psql -U your_user -d your_database -f supabase-export/insert_data.sql

# Set permissions
psql -U your_user -d your_database -f setup-db-permissions.sql
```

## System Health Monitoring

```bash
# Run system health monitor
node system-health-monitor.js

# Check system health monitor
node system-health-monitor-check.js
```

## Accessing the Application

- Frontend: `http://localhost:3000/crm`
- API Health Check: `http://localhost:3000/crm/api/health`
- System Health Dashboard: `http://localhost:3000/crm/system-monitoring`

## Common Issues

1. **Database Connection Issues**
   - Check PostgreSQL is running
   - Verify credentials in `.env` file
   - Run `node check-db-connection.js`

2. **Authentication Issues**
   - Ensure `auth_users` table exists
   - Check JWT secret in `.env` file
   - Run `node check-admin-auth.js`

3. **Docker Issues**
   - Check Docker logs: `docker-compose logs`
   - Verify ports aren't in use
   - Ensure Docker has sufficient resources

For more detailed information, refer to the comprehensive documentation in `MYAGENTVIEW_CRM_DOCUMENTATION.md`.
