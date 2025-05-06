# Docker Deployment Guide for MyAgentView CRM

This guide provides comprehensive instructions for deploying the MyAgentView CRM application using Docker in both development and production environments.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)
- Basic knowledge of Docker and containerization

## Project Structure

The MyAgentView CRM application consists of:

1. **Frontend**: A React application built with Vite
2. **Backend**: An Express.js server that serves the frontend and provides API endpoints
3. **Database**: A PostgreSQL database for storing application data
4. **Supabase**: Used for authentication and real-time features

## Environment Variables

The application requires the following environment variables:

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Secret key for JWT authentication |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port for the application | 3000 |
| `NODE_ENV` | Node.js environment | development |
| `BASE_URL` | Base URL for the application | http://localhost:3000/crm |

## Deployment Options

### Option 1: Local Development with Docker

1. **Create a `.env.local` file** with the required environment variables:

```
# Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database connection
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=localpassword

# JWT Secret
JWT_SECRET=local_jwt_secret

# Server settings
PORT=3000
BASE_URL=http://localhost:3000/crm
```

2. **Run the application** using Docker Compose:

```bash
# On Linux/macOS
./run-local.sh

# On Windows
run-local.bat
```

3. **Access the application** at http://localhost:3000/crm

### Option 2: Production Deployment with Docker

1. **Create a `.env.production` file** with the required environment variables:

```
# Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database connection
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=strong_production_password

# JWT Secret
JWT_SECRET=strong_production_jwt_secret

# Server settings
PORT=3000
NODE_ENV=production
BASE_URL=https://your-domain.com/crm
```

2. **Deploy the application** using Docker Compose:

```bash
docker-compose --env-file .env.production up -d --build
```

3. **Access the application** at https://your-domain.com/crm (assuming you have set up a reverse proxy)

### Option 3: Direct Deployment (Without Docker)

For development or debugging purposes, you can run the application directly:

1. **Create a `.env.local` file** with the required environment variables:

```
# Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret
JWT_SECRET=local_jwt_secret

# Server settings
PORT=3000
```

2. **Run the application** using the provided scripts:

```bash
# On Linux/macOS
./run-direct.sh

# On Windows
run-direct.bat
```

These scripts will:
- Check if Node.js and npm are installed
- Load environment variables from .env.local
- Start the application using run-dev.js

3. **Access the application** at http://localhost:3000

## Docker Compose Configuration

The application uses two Docker Compose files:

- `docker-compose.local.yml`: For local development
- `docker-compose.yml`: For production deployment

Both configurations include:

1. **Application Container**:
   - Node.js application
   - Serves the frontend and API
   - Connects to the database

2. **Database Container**:
   - PostgreSQL database
   - Persistent volume for data storage
   - Initialization scripts for database setup

## Troubleshooting

### Common Issues

1. **Missing Supabase Environment Variables**:
   - Error: "Missing Supabase environment variables"
   - Solution: Ensure that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in your environment variables or `.env` file.

2. **Database Connection Issues**:
   - Error: "Connection refused" or "ECONNREFUSED"
   - Solution: Check if the database container is running and the connection parameters are correct.

3. **Container Restarting**:
   - Issue: The container keeps restarting
   - Solution: Check the container logs for errors using `docker-compose logs app`.

4. **White Screen in Browser**:
   - Issue: The application shows a white screen
   - Solution: Check the browser console for errors. Ensure that the Supabase environment variables are correctly injected into the HTML.

5. **API Endpoint Not Found (404)**:
   - Issue: API requests return 404 Not Found
   - Solution: Check that the API base URL is correctly set in the frontend. The API base URL should be `/crm/api` for Docker deployment and `/api` for direct deployment.

### Debugging

To debug the application:

1. **Check container logs**:

```bash
docker-compose logs -f app
```

2. **Access the container shell**:

```bash
docker-compose exec app sh
```

3. **Check environment variables**:

```bash
docker-compose exec app env
```

4. **For direct deployment, check the server logs**:

```bash
# The logs will be displayed in the terminal where you ran the application
```

## Security Considerations

For production deployments:

1. Use strong passwords for the database
2. Use a strong JWT secret
3. Use HTTPS with a reverse proxy (like Nginx)
4. Restrict access to the database port (5432)
5. Regularly update the Docker images

## Maintenance

### Updating the Application

1. Pull the latest changes:

```bash
git pull
```

2. Rebuild and restart the containers:

```bash
docker-compose down
docker-compose up -d --build
```

### Backing Up the Database

1. Create a backup:

```bash
docker-compose exec db pg_dump -U crm_user -d crm_db > backup.sql
```

2. Restore from backup:

```bash
cat backup.sql | docker-compose exec -T db psql -U crm_user -d crm_db
```

## Conclusion

This Docker deployment guide provides a comprehensive approach to deploying the MyAgentView CRM application in both development and production environments. By following these instructions, you can ensure a consistent, isolated, and reliable deployment of the application.