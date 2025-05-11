# MyAgentView CRM Documentation

Welcome to the MyAgentView CRM documentation. This repository contains comprehensive documentation for the MyAgentView CRM system, including system architecture, deployment guides, and troubleshooting information.

## Documentation Index

### Core Documentation

- [**Comprehensive Documentation**](MYAGENTVIEW_CRM_DOCUMENTATION.md) - Complete system documentation with detailed information about all components
- [**Quick Start Guide**](MYAGENTVIEW_CRM_QUICKSTART.md) - Concise instructions for getting started quickly
- [**System Architecture**](MYAGENTVIEW_CRM_ARCHITECTURE.md) - Visual representation of system architecture and component relationships

### Deployment Guides

- [**Local Deployment Guide**](LOCAL_DEPLOYMENT_GUIDE.md) - Instructions for local deployment
- [**Docker Deployment Guide**](DOCKER_DEPLOYMENT_GUIDE.md) - Instructions for Docker deployment
- [**Production Deployment Guide**](PRODUCTION_DEPLOYMENT_GUIDE.md) - Instructions for production deployment

### Database Migration

- [**PostgreSQL Migration Documentation**](POSTGRES_MIGRATION_DOCUMENTATION.md) - Information about migrating from Supabase to PostgreSQL
- [**PostgreSQL Migration Guide**](POSTGRES_MIGRATION_GUIDE.md) - Step-by-step guide for PostgreSQL migration
- [**PostgreSQL Migration Troubleshooting**](POSTGRES_MIGRATION_TROUBLESHOOTING.md) - Troubleshooting information for PostgreSQL migration

### System Components

- [**System Health Monitoring**](SYSTEM_HEALTH_MONITORING.md) - Information about the system health monitoring feature
- [**API Routes Fix Documentation**](API_ROUTES_FIX_DOCUMENTATION.md) - Documentation for API route fixes
- [**Authentication System Patch Documentation**](AUTH_SYSTEM_PATCH_DOCUMENTATION.md) - Documentation for authentication system patches

## Running the Application

The MyAgentView CRM system can be run in several different environments:

### Local Development

```bash
npm install
npm run dev
```

### PostgreSQL Server

```bash
npm run postgres
```

### Docker Deployment

```bash
# Unix/macOS
chmod +x run-local.sh
./run-local.sh start

# Windows
run-local.bat start
```

For more detailed information, refer to the [Quick Start Guide](MYAGENTVIEW_CRM_QUICKSTART.md) or the [Comprehensive Documentation](MYAGENTVIEW_CRM_DOCUMENTATION.md).

## System Architecture

The MyAgentView CRM system follows a modern web application architecture:

- **Frontend**: React-based single-page application (SPA)
- **Backend**: Node.js Express server
- **Database**: PostgreSQL (migrated from Supabase)
- **Authentication**: JWT-based authentication system
- **Deployment**: Docker containerization for consistent deployment

For more detailed information about the system architecture, refer to the [System Architecture](MYAGENTVIEW_CRM_ARCHITECTURE.md) documentation.

## Database Migration

The system has been migrated from Supabase to PostgreSQL. For information about the migration process, refer to the [PostgreSQL Migration Documentation](POSTGRES_MIGRATION_DOCUMENTATION.md).

## Troubleshooting

For troubleshooting information, refer to the [Comprehensive Documentation](MYAGENTVIEW_CRM_DOCUMENTATION.md#troubleshooting-guide) or the specific documentation for the component you're having issues with.
