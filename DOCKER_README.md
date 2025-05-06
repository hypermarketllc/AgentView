# MyAgentView CRM Docker Deployment

This repository contains Docker configuration files for deploying the MyAgentView CRM application in both local development and production environments.

## Overview

The Docker configuration provides a consistent, isolated execution environment for the CRM application, ensuring that it runs the same way across different environments. The setup includes:

- Application container (Node.js)
- PostgreSQL database container
- Nginx web server container (production only)
- Certbot container for SSL certificates (production only)

## Directory Structure

```
.
├── Dockerfile              # Production Dockerfile
├── Dockerfile.local        # Local development Dockerfile
├── docker-compose.yml      # Production Docker Compose configuration
├── docker-compose.local.yml # Local development Docker Compose configuration
├── .dockerignore           # Files to exclude from Docker build
├── .env.local              # Local environment variables
├── .env.production         # Production environment variables template
├── run-local.sh            # Helper script for Unix-based systems
├── run-local.bat           # Helper script for Windows
├── LOCAL_DEPLOYMENT_GUIDE.md # Guide for local deployment
└── PRODUCTION_DEPLOYMENT_GUIDE.md # Guide for production deployment
```

## Quick Start

### Local Development

For local development and testing:

1. Ensure Docker and Docker Compose are installed on your machine
2. Run the helper script:

   **Unix-based systems (Linux/macOS):**
   ```bash
   chmod +x run-local.sh
   ./run-local.sh start
   ```

   **Windows:**
   ```cmd
   run-local.bat start
   ```

3. Access the application at http://localhost:3000/crm

For detailed instructions, see [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md).

### Production Deployment

For production deployment:

1. Test the application locally first
2. Transfer the necessary files to your production server
3. Configure environment variables and domain settings
4. Deploy using Docker Compose

For detailed instructions, see [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md).

## Features

- **Isolated Environment**: Consistent execution across different environments
- **Scalability**: Easy to scale with Docker Compose
- **Resource Management**: CPU and memory constraints for optimal performance
- **Health Checks**: Automatic monitoring of container health
- **Logging**: Configured log rotation to prevent disk space issues
- **Security**: SSL/TLS support with automatic certificate renewal
- **Data Persistence**: Volume mounts for database and other persistent data
- **Easy Deployment**: Simple commands to deploy, update, and manage the application

## Requirements

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (recommended)
- 2 CPU cores minimum (recommended)

## Troubleshooting

If you encounter issues:

1. Check container logs:
   ```bash
   docker-compose logs app
   ```

2. Verify container status:
   ```bash
   docker-compose ps
   ```

3. Check container health:
   ```bash
   docker inspect --format='{{json .State.Health}}' container_name
   ```

4. Refer to the detailed deployment guides for specific troubleshooting steps.

## Maintenance

### Backups

Regular database backups are recommended:

```bash
docker-compose exec db pg_dump -U crm_user -d crm_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Updates

To update the application:

```bash
git pull  # If using Git
docker-compose build
docker-compose up -d
```

## Support

For additional support or questions, please refer to the detailed deployment guides or contact the development team.