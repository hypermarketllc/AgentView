# PostgreSQL Docker Deployment Guide

This guide provides instructions for running the application with PostgreSQL in Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository if needed)

## Docker Deployment Options

There are several options for deploying the application with PostgreSQL using Docker:

1. **Development Setup**: Run both the application and PostgreSQL in separate containers
2. **Production Setup**: Run the application with an external PostgreSQL database
3. **All-in-One Setup**: Run both the application and PostgreSQL in a single Docker Compose setup

## Option 1: Development Setup

### Step 1: Create Docker Compose File

Create or modify `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: crm-postgres
    environment:
      POSTGRES_DB: crm_db
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: your_strong_password_here
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./supabase-export/create_tables.sql:/docker-entrypoint-initdb.d/01-create_tables.sql
      - ./supabase-export/create_auth_tables.sql:/docker-entrypoint-initdb.d/02-create_auth_tables.sql
      - ./supabase-export/insert_data.sql:/docker-entrypoint-initdb.d/03-insert_data.sql
      - ./setup-db-permissions.sql:/docker-entrypoint-initdb.d/04-setup_permissions.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm_user -d crm_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: crm-app
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=crm_db
      - POSTGRES_USER=crm_user
      - POSTGRES_PASSWORD=your_strong_password_here
      - JWT_SECRET=your_jwt_secret
      - PORT=3000
      - NODE_ENV=development
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./:/app
      - /app/node_modules

volumes:
  postgres-data:
```

### Step 2: Create Development Dockerfile

Create `Dockerfile.dev`:

```dockerfile
FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Copy the MIME type fix files
COPY fix-mime-types.mjs inject-mime-fix.js ./

# Expose the port
EXPOSE 3000

# Start the server with the MIME type fixes
CMD ["node", "run-fixed-postgres-docker.js"]
```

### Step 3: Run the Development Setup

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Option 2: Production Setup

### Step 1: Create Docker Compose File

Create or modify `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.postgres
    container_name: crm-app-prod
    environment:
      - POSTGRES_HOST=${POSTGRES_HOST}
      - POSTGRES_PORT=${POSTGRES_PORT}
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
      - NODE_ENV=production
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/crm/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 2: Create Production Dockerfile

Create `Dockerfile.postgres`:

```dockerfile
FROM node:16-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Build the application if needed
# RUN npm run build

FROM node:16-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server-postgres-docker.js ./
COPY --from=builder /app/fix-mime-types.mjs ./
COPY --from=builder /app/inject-mime-fix.js ./
COPY --from=builder /app/path-to-regexp-patch-esm.js ./

# Expose the port
EXPOSE 3000

# Create a healthcheck script
COPY docker-healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD [ "docker-healthcheck.sh" ]

# Start the server with the MIME type fixes
CMD ["node", "server-postgres-docker.js"]
```

### Step 3: Create Environment File

Create `.env.production`:

```
# PostgreSQL Connection
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_strong_password_here

# JWT Secret
JWT_SECRET=your_jwt_secret

# Application Settings
PORT=3000
NODE_ENV=production
```

### Step 4: Run the Production Setup

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

## Option 3: All-in-One Setup

### Step 1: Create Docker Compose File

Create or modify `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: crm-postgres
    environment:
      POSTGRES_DB: crm_db
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: your_strong_password_here
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./supabase-export/create_tables.sql:/docker-entrypoint-initdb.d/01-create_tables.sql
      - ./supabase-export/create_auth_tables.sql:/docker-entrypoint-initdb.d/02-create_auth_tables.sql
      - ./supabase-export/insert_data.sql:/docker-entrypoint-initdb.d/03-insert_data.sql
      - ./setup-db-permissions.sql:/docker-entrypoint-initdb.d/04-setup_permissions.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm_user -d crm_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile.postgres
    container_name: crm-app
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=crm_db
      - POSTGRES_USER=crm_user
      - POSTGRES_PASSWORD=your_strong_password_here
      - JWT_SECRET=your_jwt_secret
      - PORT=3000
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: crm-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres-data:
```

### Step 2: Create Nginx Configuration

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Handle JavaScript files with correct MIME type
    location ~* \.js$ {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Set the correct MIME type for JavaScript files
        add_header Content-Type "application/javascript; charset=utf-8";
    }
}
```

### Step 3: Run the All-in-One Setup

```bash
docker-compose up --build -d
```

## Accessing the Application

Once the containers are running, you can access the application at:

- Web Interface: [http://localhost:3000/crm](http://localhost:3000/crm)
- API Endpoint: [http://localhost:3000/crm/api](http://localhost:3000/crm/api)

## Troubleshooting Docker Deployments

### Container Logs

To view the logs of a specific container:

```bash
docker logs crm-app
```

To follow the logs in real-time:

```bash
docker logs -f crm-app
```

### Database Connection Issues

If the application container cannot connect to the PostgreSQL container:

1. Check if the PostgreSQL container is running:

```bash
docker ps | grep postgres
```

2. Check the PostgreSQL container logs:

```bash
docker logs crm-postgres
```

3. Verify the environment variables in the application container:

```bash
docker exec crm-app env | grep POSTGRES
```

### MIME Type Issues

If you encounter MIME type issues in the Docker deployment:

1. Check if the MIME type fix files are correctly copied to the container:

```bash
docker exec crm-app ls -la | grep mime
```

2. Check the application logs for MIME type related messages:

```bash
docker logs crm-app | grep MIME
```

3. Try accessing the application through the Nginx proxy if available, as it sets the correct MIME types.

## Additional Docker Commands

### Stopping the Containers

```bash
docker-compose -f docker-compose.dev.yml down  # Development setup
docker-compose -f docker-compose.prod.yml down  # Production setup
docker-compose down  # All-in-One setup
```

### Removing Volumes

```bash
docker-compose -f docker-compose.dev.yml down -v  # Development setup
docker-compose -f docker-compose.prod.yml down -v  # Production setup
docker-compose down -v  # All-in-One setup
```

### Rebuilding the Containers

```bash
docker-compose -f docker-compose.dev.yml up --build -d  # Development setup
docker-compose -f docker-compose.prod.yml up --build -d  # Production setup
docker-compose up --build -d  # All-in-One setup
```

## Conclusion

This guide provides multiple options for deploying the application with PostgreSQL using Docker. Choose the option that best fits your needs and environment.

For more detailed information about the PostgreSQL migration and MIME type fixes, refer to the other documentation files:

- `POSTGRES_MIGRATION_FIXES.md`
- `MIME_TYPE_FIX_TECHNICAL.md`
- `POSTGRES_QUICKSTART.md`
