#!/bin/bash

# Script to clean up Docker containers and images for the modular server

echo "Stopping modular Docker container if running..."
docker stop myagentview-modular-container 2>/dev/null || true

echo "Removing modular Docker container if it exists..."
docker rm myagentview-modular-container 2>/dev/null || true

echo "Removing modular Docker image if it exists..."
docker rmi myagentview-modular 2>/dev/null || true

echo "Cleanup complete."
echo "You can now run ./run-modular-docker.sh to build and run a fresh container."
