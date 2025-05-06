# Docker Deployment Guide for MyAgentView CRM

This guide provides instructions for deploying the MyAgentView CRM application using Docker in both local development and production environments.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)
- Basic knowledge of Docker and containerization

## Local Development Deployment

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd myagentview-crm
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database connection
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=localpassword

# JWT Secret
JWT_SECRET=local_jwt_secret

# Server settings
PORT=3000
BASE_URL=http://localhost:3000/crm
```

### Step 3: Run the Application

#### On Linux/macOS:

```bash
chmod +x run-local.sh
./run-local.sh
```

#### On Windows:

```
run-local.bat
```

This will:
1. Build the Docker images
2. Start the containers
3. Initialize the database
4. Start the application

### Step 4: Access the Application

Once the application is running, you can access it at:

```
http://localhost:3000/crm
```

Use the default test account:
- Email: agent@example.com
- Password: Agent123!

### Step 5: Stop the Application

To stop the application:

```bash
docker-compose -f docker-compose.local.yml down
```

## Production Deployment

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd myagentview-crm
```

### Step 2: Configure Environment Variables

Create a `.env.production` file in the root directory with the following variables:

```
# Database connection
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=<strong-password>

# JWT Secret
JWT_SECRET=<strong-jwt-secret>

# Server settings
PORT=3000
APP_PORT=3000
DB_PORT=5432
```

Replace `<strong-password>` and `<strong-jwt-secret>` with secure values.

### Step 3: Build and Run the Application

```bash
docker-compose --env-file .env.production up -d --build
```

### Step 4: Access the Application

Once the application is running, you can access it at:

```
http://<your-server-ip>:3000/crm
```

### Step 5: Monitor the Application

To view the logs:

```bash
docker-compose logs -f
```

To check the status of the containers:

```bash
docker-compose ps
```

### Step 6: Stop the Application

To stop the application:

```bash
docker-compose down
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| POSTGRES_DB | PostgreSQL database name | crm_db |
| POSTGRES_USER | PostgreSQL username | crm_user |
| POSTGRES_PASSWORD | PostgreSQL password | - |
| JWT_SECRET | Secret key for JWT authentication | - |
| PORT | Port for the application | 3000 |
| APP_PORT | External port for the application | 3000 |
| DB_PORT | External port for the database | 5432 |

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

### Database Connection Issues

If the application cannot connect to the database:

1. Check if the database container is running:
   ```bash
   docker-compose ps
   ```

2. Check the database logs:
   ```bash
   docker-compose logs db
   ```

3. Verify the environment variables are correctly set.

### Application Startup Issues

If the application fails to start:

1. Check the application logs:
   ```bash
   docker-compose logs app
   ```

2. Verify the database is properly initialized:
   ```bash
   docker-compose exec db psql -U crm_user -d crm_db -c "\dt"
   ```

3. Check if the required environment variables are set.

## Security Considerations

For production deployments:

1. Use strong passwords for the database
2. Use a strong JWT secret
3. Consider using a reverse proxy (like Nginx) for SSL termination
4. Restrict access to the database port (5432)
5. Regularly update the Docker images