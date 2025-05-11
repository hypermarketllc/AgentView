# Migrating from Supabase to PostgreSQL in Docker

This guide provides step-by-step instructions for migrating the MyAgentView CRM application from Supabase to PostgreSQL running in Docker.

## Prerequisites

- Docker Engine (20.10+)
- Docker Compose (2.0+)
- Node.js (14+)
- Git repository with the MyAgentView CRM code

## Migration Steps

### 1. Set Up PostgreSQL Docker Environment

First, we need to set up a PostgreSQL Docker environment:

```bash
# Create a directory for PostgreSQL data (if it doesn't exist)
mkdir -p postgres-data

# Create a .env.postgres file with PostgreSQL configuration
cat > .env.postgres << EOL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DOCKER_PORT=5432
EOL
```

### 2. Start PostgreSQL Docker Container

Use Docker Compose to start a PostgreSQL container:

```bash
# For Unix/macOS
chmod +x run-postgres-docker.sh
./run-postgres-docker.sh

# For Windows
run-postgres-docker.bat
```

This will start a PostgreSQL container using the configuration in `docker-compose.postgres.yml`.

### 3. Create Database Schema

Create the database schema using the SQL scripts exported from Supabase:

```bash
# Connect to the PostgreSQL container
docker exec -it crm-postgres psql -U crm_user -d crm_db

# Inside the PostgreSQL container, run the following commands
\i /app/supabase-export/create_tables.sql
\i /app/supabase-export/create_auth_tables.sql
\i /app/supabase-export/insert_data.sql
\i /app/setup-db-permissions.sql
\q
```

### 4. Configure Application to Use PostgreSQL

Update the application configuration to use PostgreSQL instead of Supabase:

1. Create or modify `.env` file:

```bash
cat > .env << EOL
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

# Use PostgreSQL instead of Supabase
USE_POSTGRES=true
EOL
```

### 5. Test PostgreSQL Connection

Test the connection to the PostgreSQL database:

```bash
# For Unix/macOS
chmod +x run-check-db-connection.sh
./run-check-db-connection.sh

# For Windows
run-check-db-connection.bat
```

This will run the `check-db-connection.js` script to verify that the application can connect to the PostgreSQL database.

### 6. Test Authentication

Test that authentication works with PostgreSQL:

```bash
# For Unix/macOS
chmod +x run-check-admin-auth.sh
./run-check-admin-auth.sh

# For Windows
run-check-admin-auth.bat
```

This will run the `check-admin-auth.js` script to verify that authentication works with PostgreSQL.

### 7. Run the Application with PostgreSQL

Run the application using PostgreSQL:

```bash
# For Unix/macOS
npm run postgres

# For Windows
npm run postgres
```

This will start the application using the `server-postgres.js` server, which is configured to use PostgreSQL.

### 8. Run the Application with PostgreSQL in Docker

To run the entire application (including PostgreSQL) in Docker:

```bash
# For Unix/macOS
chmod +x run-postgres-docker.sh
./run-postgres-docker.sh

# For Windows
run-postgres-docker.bat
```

This will start both the application and PostgreSQL in Docker containers.

## Troubleshooting

### Database Connection Issues

If you encounter issues connecting to the PostgreSQL database:

1. Check that the PostgreSQL container is running:

```bash
docker ps
```

2. Check the PostgreSQL container logs:

```bash
docker logs crm-postgres
```

3. Verify the database credentials in the `.env` file.

4. Try connecting to the database directly:

```bash
docker exec -it crm-postgres psql -U crm_user -d crm_db
```

### Authentication Issues

If you encounter authentication issues:

1. Check that the `auth_users` table exists and has the correct schema:

```bash
docker exec -it crm-postgres psql -U crm_user -d crm_db -c "\d auth_users"
```

2. Verify that the JWT secret is correctly set in the `.env` file.

3. Check for any errors in the server logs.

### Data Migration Issues

If you encounter issues with data migration:

1. Check that the data was correctly imported:

```bash
docker exec -it crm-postgres psql -U crm_user -d crm_db -c "SELECT COUNT(*) FROM users"
docker exec -it crm-postgres psql -U crm_user -d crm_db -c "SELECT COUNT(*) FROM auth_users"
```

2. Check for any errors in the SQL scripts:

```bash
docker exec -it crm-postgres psql -U crm_user -d crm_db -f /app/supabase-export/create_tables.sql
```

## Additional Resources

For more information, refer to the following resources:

- [PostgreSQL Migration Documentation](POSTGRES_MIGRATION_DOCUMENTATION.md)
- [PostgreSQL Migration Guide](POSTGRES_MIGRATION_GUIDE.md)
- [PostgreSQL Migration Troubleshooting](POSTGRES_MIGRATION_TROUBLESHOOTING.md)
- [Docker Deployment Guide](DOCKER_DEPLOYMENT_GUIDE.md)
