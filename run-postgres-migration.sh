#!/bin/bash

# PostgreSQL Migration Script
# This script migrates the application from Supabase to PostgreSQL

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '#' | awk '/=/ {print $1}')
fi

# Set default values if not provided in environment
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-crm_db}
POSTGRES_USER=${POSTGRES_USER:-crm_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-your_strong_password_here}

echo "Starting PostgreSQL migration..."
echo "Host: $POSTGRES_HOST"
echo "Port: $POSTGRES_PORT"
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_USER"

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT
if [ $? -ne 0 ]; then
  echo "PostgreSQL is not running. Please start PostgreSQL first."
  exit 1
fi

# Create database and user if they don't exist
echo "Creating database and user if they don't exist..."
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U postgres -c "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1
if [ $? -ne 0 ]; then
  echo "Creating database $POSTGRES_DB..."
  psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U postgres -c "CREATE DATABASE $POSTGRES_DB"
fi

psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U postgres -c "SELECT 1 FROM pg_roles WHERE rolname = '$POSTGRES_USER'" | grep -q 1
if [ $? -ne 0 ]; then
  echo "Creating user $POSTGRES_USER..."
  psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U postgres -c "CREATE USER $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD'"
  psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER"
fi

# Run schema creation scripts
echo "Creating database schema..."
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f supabase-export/create_tables.sql
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f supabase-export/create_auth_tables.sql

# Set up permissions
echo "Setting up database permissions..."
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f setup-db-permissions.sql

# Import data from Supabase export
echo "Importing data from Supabase export..."
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f supabase-export/insert_data.sql

# Run complete migration script
echo "Running complete migration script..."
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f complete-postgres-migration.sql

echo "Migration completed successfully!"
echo "You can now run the application with PostgreSQL using:"
echo "npm run dev"
