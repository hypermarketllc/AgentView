#!/bin/bash

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker run --name crm-postgres \
  -e POSTGRES_DB=crm_db \
  -e POSTGRES_USER=crm_user \
  -e POSTGRES_PASSWORD=your_strong_password_here \
  -p 5432:5432 \
  -v "$(pwd)/supabase-export/create_tables.sql:/docker-entrypoint-initdb.d/01-create_tables.sql" \
  -v "$(pwd)/supabase-export/create_auth_tables.sql:/docker-entrypoint-initdb.d/02-create_auth_tables.sql" \
  -v "$(pwd)/supabase-export/insert_data.sql:/docker-entrypoint-initdb.d/03-insert_data.sql" \
  -v "$(pwd)/setup-db-permissions.sql:/docker-entrypoint-initdb.d/04-setup-permissions.sql" \
  -d postgres:15

echo "PostgreSQL container started. Waiting for it to be ready..."
sleep 5

echo "PostgreSQL is now running on localhost:5432"
echo "Database: crm_db"
echo "User: crm_user"
echo "Password: your_strong_password_here"
echo ""
echo "To stop the container, run: docker stop crm-postgres && docker rm crm-postgres"
