# MyAgentView CRM System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [System Components](#system-components)
4. [Database Structure](#database-structure)
5. [Running the Application](#running-the-application)
6. [Authentication System](#authentication-system)
7. [API Endpoints](#api-endpoints)
8. [System Health Monitoring](#system-health-monitoring)
9. [Error Logging System](#error-logging-system)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Maintenance and Updates](#maintenance-and-updates)

## System Overview

MyAgentView CRM is a comprehensive Customer Relationship Management system designed for managing agent-based sales operations. The system provides functionality for user management, deal tracking, commission calculations, and system health monitoring.

### Key Features

- User authentication and authorization
- Agent management and hierarchy
- Deal tracking and management
- Commission calculations and splits
- System health monitoring
- Error logging and reporting
- Integration with external services (Discord, Telegram)

## System Architecture

MyAgentView CRM follows a modern web application architecture:

- **Frontend**: React-based single-page application (SPA)
- **Backend**: Node.js Express server
- **Database**: PostgreSQL (migrated from Supabase)
- **Authentication**: JWT-based authentication system
- **Deployment**: Docker containerization for consistent deployment

### Architecture Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  Frontend   │◄────►│   Backend   │◄────►│  Database   │
│  (React)    │      │  (Express)  │      │ (PostgreSQL)│
│             │      │             │      │             │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  External   │
                     │  Services   │
                     │ (Discord,   │
                     │  Telegram)  │
                     └─────────────┘
```

## System Components

### Frontend Components

The frontend is built with React and includes the following main components:

1. **Authentication Components**
   - Login.tsx
   - Register.tsx
   - AuthContext.tsx (manages authentication state)

2. **Dashboard Components**
   - Dashboard.tsx (main dashboard view)
   - DashboardLayout.tsx (layout wrapper for authenticated views)

3. **User Management Components**
   - UserSettings.tsx (user profile and settings)
   - Agents.tsx (agent management)

4. **Deal Management Components**
   - DealForm.tsx (form for creating/editing deals)
   - PostDeal.tsx (deal submission)

5. **System Components**
   - SystemMonitoring.tsx (system health monitoring)
   - Configuration.tsx (system configuration)

### Backend Components

The backend is built with Node.js and Express and includes:

1. **Server Modules**
   - server.js (main server entry point)
   - server-postgres.js (PostgreSQL-specific server)
   - server-docker.js (Docker-specific server)

2. **API Routes**
   - auth.js (authentication routes)
   - server-docker-routes.js (API routes)
   - server-docker-auth.js (authentication routes for Docker)

3. **Database Access**
   - postgres.ts/js (PostgreSQL connection and queries)
   - supabase.ts (legacy Supabase connection)
   - supabase-postgres-adapter.js (adapter for migration)

4. **Utility Modules**
   - module-loader.js (dynamic module loading)
   - error-handler.js (error handling)
   - route-registrar.js (API route registration)

5. **Services**
   - health-monitor-service.js (system health monitoring)
   - scheduler-service.js (scheduled tasks)
   - api-service.js (API service layer)

## Database Structure

The database consists of the following main tables:

1. **users**: Stores user information
   - id (UUID, primary key)
   - email (VARCHAR)
   - name (VARCHAR)
   - position_id (UUID, foreign key to positions)
   - created_at (TIMESTAMP)

2. **auth_users**: Stores authentication information
   - id (UUID, primary key)
   - user_id (UUID, foreign key to users)
   - email (VARCHAR)
   - password_hash (VARCHAR)
   - created_at (TIMESTAMP)

3. **user_accs**: Stores user account settings
   - id (UUID, primary key)
   - user_id (UUID, foreign key to users)
   - settings (JSONB)
   - preferences (JSONB)
   - created_at (TIMESTAMP)

4. **positions**: Stores position information
   - id (UUID, primary key)
   - name (VARCHAR)
   - level (INTEGER)
   - created_at (TIMESTAMP)

5. **deals**: Stores deal information
   - id (UUID, primary key)
   - user_id (UUID, foreign key to users)
   - carrier_id (UUID, foreign key to carriers)
   - product_id (UUID, foreign key to products)
   - amount (DECIMAL)
   - status (VARCHAR)
   - created_at (TIMESTAMP)

6. **carriers**: Stores carrier information
   - id (UUID, primary key)
   - name (VARCHAR)
   - created_at (TIMESTAMP)

7. **products**: Stores product information
   - id (UUID, primary key)
   - name (VARCHAR)
   - carrier_id (UUID, foreign key to carriers)
   - created_at (TIMESTAMP)

8. **commissions**: Stores commission information
   - id (UUID, primary key)
   - deal_id (UUID, foreign key to deals)
   - user_id (UUID, foreign key to users)
   - amount (DECIMAL)
   - created_at (TIMESTAMP)

9. **commission_splits**: Stores commission split information
   - id (UUID, primary key)
   - commission_id (UUID, foreign key to commissions)
   - user_id (UUID, foreign key to users)
   - amount (DECIMAL)
   - created_at (TIMESTAMP)

10. **system_health_checks**: Stores system health check information
    - id (UUID, primary key)
    - endpoint (VARCHAR)
    - category (VARCHAR)
    - status (VARCHAR)
    - response_time (INTEGER)
    - status_code (INTEGER)
    - created_at (TIMESTAMP)

11. **system_errors**: Stores system error information (Console Release Package)
    - id (UUID, primary key)
    - error_type (VARCHAR)
    - message (TEXT)
    - details (JSONB)
    - stack_trace (TEXT)
    - resolved (BOOLEAN)
    - created_at (TIMESTAMP)

## Running the Application

MyAgentView CRM can be run in several different environments and configurations:

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- Docker and Docker Compose (for containerized deployment)
- Git (for source code management)

### Environment Configuration

The application uses environment variables for configuration. Create one of the following files based on your deployment:

- `.env.local`: Local development environment
- `.env.docker`: Docker development environment
- `.env.production`: Production environment

Example `.env` file:

```
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_strong_password_here

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h

# Module System Configuration
NODE_MODULE_TYPE=module
USE_ESM=true

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
POSTGRES_DOCKER_PORT=5432
NGINX_PORT=8080
DEV_SERVER_PORT=5173
```

### Local Development

To run the application in local development mode:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

This will start the application in development mode with hot reloading.

### PostgreSQL Server

To run the application with PostgreSQL:

1. Ensure PostgreSQL is running and accessible
2. Run the PostgreSQL server:
   ```bash
   npm run postgres
   ```

### Docker Deployment

#### Local Docker Deployment

To run the application in a local Docker environment:

1. For Unix-based systems (Linux/macOS):
   ```bash
   chmod +x run-local.sh
   ./run-local.sh start
   ```

2. For Windows:
   ```cmd
   run-local.bat start
   ```

This will start the application in a Docker container using the `docker-compose.local.yml` configuration.

#### Production Docker Deployment

To run the application in a production Docker environment:

1. For Unix-based systems (Linux/macOS):
   ```bash
   chmod +x run-prod.sh
   ./run-prod.sh start
   ```

2. For Windows:
   ```cmd
   run-prod.bat start
   ```

This will start the application in a Docker container using the `docker-compose.prod.yml` configuration.

### PostgreSQL Docker Deployment

To run the application with PostgreSQL in Docker:

1. For Unix-based systems (Linux/macOS):
   ```bash
   chmod +x run-postgres-docker.sh
   ./run-postgres-docker.sh
   ```

2. For Windows:
   ```cmd
   run-postgres-docker.bat
   ```

### PostgreSQL Migration

To migrate from Supabase to PostgreSQL:

1. Export data from Supabase (already done in `supabase-export` directory)
2. Create tables in PostgreSQL:
   ```bash
   psql -U your_user -d your_database -f supabase-export/create_tables.sql
   ```
3. Import data into PostgreSQL:
   ```bash
   psql -U your_user -d your_database -f supabase-export/insert_data.sql
   ```
4. Set up database permissions:
   ```bash
   psql -U your_user -d your_database -f setup-db-permissions.sql
   ```

### PostgreSQL Connection Check

To check the PostgreSQL connection:

1. For Unix-based systems (Linux/macOS):
   ```bash
   chmod +x run-postgres-check.sh
   ./run-postgres-check.sh
   ```

2. For Windows:
   ```cmd
   run-postgres-check.bat
   ```

### Console Release Package

To run the application with error logging:

1. For Unix-based systems (Linux/macOS):
   ```bash
   cd Console_Release_Complete_Package
   chmod +x run_docker_with_error_logging.sh
   ./run_docker_with_error_logging.sh
   ```

2. For Windows:
   ```cmd
   cd Console_Release_Complete_Package
   run_server_with_error_logging.bat
   ```

## Authentication System

The authentication system uses JWT (JSON Web Tokens) for secure authentication:

1. **Registration**: Users register with email and password
2. **Login**: Users login with email and password to receive a JWT
3. **Authentication**: JWTs are used to authenticate API requests
4. **Authorization**: User permissions are based on their position level

### Authentication Flow

1. User submits login credentials (email/password)
2. Server validates credentials against the database
3. If valid, server generates a JWT with user information
4. JWT is returned to the client and stored (typically in localStorage)
5. Client includes JWT in Authorization header for subsequent requests
6. Server validates JWT for each protected request

## API Endpoints

The application provides the following main API endpoints:

### Authentication Endpoints

- `POST /crm/api/auth/login`: User login
- `POST /crm/api/auth/register`: User registration
- `GET /crm/api/auth/me`: Get current user information

### User Endpoints

- `GET /crm/api/user/settings`: Get user settings
- `PUT /crm/api/user/settings`: Update user settings
- `PUT /crm/api/user/password`: Update user password

### Deal Endpoints

- `GET /crm/api/deals`: Get all deals
- `GET /crm/api/deals/:id`: Get a specific deal
- `POST /crm/api/deals`: Create a new deal
- `PUT /crm/api/deals/:id`: Update a deal
- `DELETE /crm/api/deals/:id`: Delete a deal

### Commission Endpoints

- `GET /crm/api/commissions`: Get all commissions
- `GET /crm/api/commissions/:id`: Get a specific commission
- `POST /crm/api/commissions`: Create a new commission
- `PUT /crm/api/commissions/:id`: Update a commission
- `DELETE /crm/api/commissions/:id`: Delete a commission

### System Health Endpoints

- `GET /crm/api/system-health-checks`: Get all system health checks
- `GET /crm/api/system-health-checks/:id`: Get a specific system health check
- `POST /crm/api/system-health-checks`: Create a system health check
- `DELETE /crm/api/system-health-checks/:id`: Delete a system health check

### Error Logging Endpoints (Console Release Package)

- `GET /api/errors`: Get all errors
- `POST /api/console/patch`: Run system patches

## System Health Monitoring

The System Health Monitoring feature provides real-time monitoring of various endpoints in the application:

### Components

1. **Database Table**: `system_health_checks` stores the results of health checks
2. **API Endpoints**: Endpoints for interacting with system health checks
3. **System Health Monitor Service**: Periodically checks endpoint status
4. **Frontend Component**: Displays health check results

### Running the System Health Monitor

To run the System Health Monitor:

```bash
node system-health-monitor.js
```

To check if the System Health Monitor is working correctly:

```bash
node system-health-monitor-check.js
```

## Error Logging System

The Error Logging System (part of the Console Release Package) provides comprehensive error tracking and reporting:

### Components

1. **Database Table**: `system_errors` stores error information
2. **WebSocket Server**: Provides real-time error notifications
3. **Error Logging Utility**: `logErrorToDB.js` logs errors to the database
4. **API Endpoints**: Endpoints for retrieving error information
5. **Error Handlers**: Global error handlers for capturing unhandled errors

### Running with Error Logging

To run the application with error logging:

```bash
cd Console_Release_Complete_Package
node run_server_with_error_logging.js
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Database Connection Issues

**Issue**: Unable to connect to the PostgreSQL database
**Solution**:
1. Check that PostgreSQL is running
2. Verify database credentials in `.env` file
3. Ensure the database exists
4. Check network connectivity to the database server

#### Authentication Issues

**Issue**: Unable to login or register
**Solution**:
1. Check that the `auth_users` table exists and has the correct schema
2. Verify that the JWT secret is correctly set in the `.env` file
3. Check for any errors in the server logs

#### Docker Deployment Issues

**Issue**: Docker containers fail to start
**Solution**:
1. Check Docker logs: `docker-compose -f docker-compose.yml logs`
2. Verify that all required environment variables are set
3. Ensure that ports are not already in use
4. Check that Docker has sufficient resources

#### System Health Monitoring Issues

**Issue**: System health checks are failing
**Solution**:
1. Check that all required services are running
2. Verify that the `system_health_checks` table exists
3. Check for any errors in the server logs
4. Ensure that the endpoints being monitored are accessible

## Maintenance and Updates

### Applying Patches

To apply patches to the system:

```bash
npm run apply-patch
```

This will run the patch application process defined in `apply-robust-patch.js`.

### Database Migrations

To apply database migrations:

```bash
node apply-all-migrations.js
```

This will apply all pending database migrations.

### Backup and Restore

#### Backup

To backup the PostgreSQL database:

```bash
pg_dump -U your_user -d your_database > backup.sql
```

#### Restore

To restore the PostgreSQL database:

```bash
psql -U your_user -d your_database -f backup.sql
```

### System Updates

To update the system:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Apply any pending migrations:
   ```bash
   node apply-all-migrations.js
   ```

4. Restart the application:
   ```bash
   npm run start
   ```

Or if using Docker:

```bash
./run-prod.sh restart
