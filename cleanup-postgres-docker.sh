#!/bin/bash
echo "Cleaning up PostgreSQL Docker container..."

echo "Stopping container..."
docker stop agentview-postgres

echo "Removing container..."
docker rm agentview-postgres

echo "Removing volume..."
docker volume rm agentview_postgres-data

echo "Done!"
echo "Press Enter to continue..."
read
