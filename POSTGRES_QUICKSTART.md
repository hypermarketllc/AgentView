# PostgreSQL Migration Quick Start Guide

This guide provides simple instructions for running the application with PostgreSQL instead of Supabase.

## Prerequisites

- Node.js (v14 or later)
- PostgreSQL database server (v12 or later)
- Git (to clone the repository if needed)

## Setup Instructions

### 1. Environment Configuration

Create or update your `.env` file with PostgreSQL connection details:

```
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_strong_password_here

# JWT Secret
JWT_SECRET=your_jwt_secret

# Application Settings
PORT=3000
NODE_ENV=development
```

Replace the values with your actual PostgreSQL connection details.

### 2. Database Setup

1. Create the PostgreSQL database:

```sql
CREATE DATABASE crm_db;
CREATE USER crm_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
```

2. Import the schema and data:

```bash
# From the project root directory
psql -U crm_user -d crm_db -f supabase-export/create_tables.sql
psql -U crm_user -d crm_db -f supabase-export/create_auth_tables.sql
psql -U crm_user -d crm_db -f supabase-export/insert_data.sql
psql -U crm_user -d crm_db -f setup-db-permissions.sql
```

### 3. Running the Application

We've created convenient scripts to run the application with all the necessary fixes:

#### On Windows:

```bash
# Run the application
run-fixed-postgres-docker.bat
```

#### On macOS/Linux:

```bash
# Make the script executable
chmod +x run-fixed-postgres-docker.sh

# Run the application
./run-fixed-postgres-docker.sh
```

#### Using Node.js directly:

```bash
node run-fixed-postgres-docker.js
```

### 4. Accessing the Application

Once the server is running, you can access the application at:

- Web Interface: [http://localhost:3000/crm](http://localhost:3000/crm)
- API Endpoint: [http://localhost:3000/crm/api](http://localhost:3000/crm/api)

## Default Login Credentials

For testing purposes, you can use these default accounts:

1. **Admin User**:
   - Email: admin@example.com
   - Password: Admin123!

2. **Agent User**:
   - Email: agent@example.com
   - Password: Agent123!

## Troubleshooting

### MIME Type Errors

If you see errors related to MIME types in the browser console, make sure you're using the `run-fixed-postgres-docker` scripts which include the necessary fixes.

### Database Connection Issues

If you encounter database connection issues:

1. Verify your PostgreSQL server is running
2. Check the connection details in your `.env` file
3. Ensure the database and user exist with proper permissions
4. Run the `check-db-connection.js` script:

```bash
node check-db-connection.js
```

### JavaScript Module Loading Issues

If you encounter issues with JavaScript modules not loading:

1. Clear your browser cache
2. Try using a different browser
3. Check the browser console for specific error messages

## Additional Resources

For more detailed information, refer to these documentation files:

- `POSTGRES_MIGRATION_FIXES.md` - Overview of the fixes implemented
- `MIME_TYPE_FIX_TECHNICAL.md` - Technical details of the MIME type fixes
- `POSTGRES_MIGRATION_GUIDE.md` - Complete migration guide

## Support

If you encounter any issues not covered in this guide, please contact the development team for assistance.
