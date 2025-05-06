# Local Docker Deployment Guide for MyAgentView CRM

This guide provides step-by-step instructions for deploying and testing the MyAgentView CRM application locally using Docker and Docker Compose.

## Prerequisites

- Docker Engine (20.10+) installed on your local machine
- Docker Compose (2.0+) installed on your local machine
- Git (to clone the repository if needed)

## Local Deployment Steps

### 1. Prepare the Environment and Scripts

#### For Unix-based systems (Linux/macOS):
Make the run script executable:
```bash
chmod +x run-local.sh
```

You can then use the script to manage your local deployment:
```bash
# Start the application
./run-local.sh start

# View logs
./run-local.sh logs

# Stop the application
./run-local.sh stop

# Show container status
./run-local.sh status

# Clean up (remove containers, networks, and volumes)
./run-local.sh clean
```

#### For Windows:
Windows users can use the provided batch script:
```cmd
# Start the application
run-local.bat start

# View logs
run-local.bat logs

# Stop the application
run-local.bat stop

# Show container status
run-local.bat status

# Clean up (remove containers, networks, and volumes)
run-local.bat clean
```

Alternatively, you can run the Docker Compose commands directly:
```cmd
# Start the application
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs

# Stop the application
docker-compose -f docker-compose.local.yml down
```

### 2. Prepare the Environment

Create a `.env.local` file in the project root directory with the following content:

```
# Supabase credentials (if using Supabase)
VITE_SUPABASE_URL=https://esmboovriahdhtvvxgzn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWJvb3ZyaWFoZGh0dnZ4Z3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzAwMTgsImV4cCI6MjA2MDMwNjAxOH0.8t1o1yk8ozklE5ltv3mNV7LHKnKZe9kdNzFTd29klIA
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWJvb3ZyaWFoZGh0dnZ4Z3puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDczMDAxOCwiZXhwIjoyMDYwMzA2MDE4fQ.ba6BXQqd0_NpYEKIF_qUxHuOjNJKXO_-AOnZmHL4AxA
```

### 2. Build and Start the Services

```bash
# Build and start the containers in detached mode
docker-compose -f docker-compose.local.yml up -d

# Check if all services are running
docker-compose -f docker-compose.local.yml ps
```

### 3. Verify the Deployment

Access your application at `http://localhost:3000/crm`

You can also check the API health endpoint at `http://localhost:3000/crm/api/health`

### 4. View Application Logs

```bash
# View logs for all services
docker-compose -f docker-compose.local.yml logs

# View logs for a specific service
docker-compose -f docker-compose.local.yml logs app
docker-compose -f docker-compose.local.yml logs db

# Follow logs in real-time
docker-compose -f docker-compose.local.yml logs -f
```

### 5. Access the Database

You can connect to the PostgreSQL database using your preferred database client with the following credentials:

- Host: localhost
- Port: 5432
- Database: crm_db
- Username: crm_user
- Password: localpassword

Or connect using the Docker CLI:

```bash
docker-compose -f docker-compose.local.yml exec db psql -U crm_user -d crm_db
```

### 6. Stop the Services

```bash
# Stop the containers but keep the volumes
docker-compose -f docker-compose.local.yml down

# Stop the containers and remove the volumes (will delete all data)
docker-compose -f docker-compose.local.yml down -v
```

## Troubleshooting

### 1. Container Fails to Start

Check the logs:

```bash
docker-compose -f docker-compose.local.yml logs app
```

### 2. Database Connection Issues

Verify database connection:

```bash
docker-compose -f docker-compose.local.yml exec app node -e "const { Pool } = require('pg'); const pool = new Pool({host: 'db', port: 5432, database: 'crm_db', user: 'crm_user', password: 'localpassword'}); pool.query('SELECT NOW()', (err, res) => { console.log(err, res); pool.end(); });"
```

### 3. Port Conflicts

If you have port conflicts (e.g., port 3000 or 5432 is already in use), modify the port mappings in `docker-compose.local.yml`:

```yaml
ports:
  - "3001:3000"  # Map container port 3000 to host port 3001
```

### 4. Volume Permissions

If you encounter permission issues with volumes:

```bash
# Fix permissions for PostgreSQL data directory
docker-compose -f docker-compose.local.yml down
sudo chown -R $USER:$USER ./postgres-data-local
docker-compose -f docker-compose.local.yml up -d
```

## Next Steps

Once you've verified that the application works correctly in the local Docker environment, you can proceed to deploy it to your production server using the production Docker Compose configuration (`docker-compose.yml`).