#!/bin/bash

# Build the Docker image using the modular Dockerfile
echo "Building Docker image with modularized server..."
docker build -t myagentview-modular -f Dockerfile.modular .

# Run the Docker container
echo "Running Docker container with modularized server..."
docker run -p 3001:3000 --name myagentview-modular-container \
  --env-file .env \
  -d myagentview-modular

echo "Container started. Application should be available at http://localhost:3001/crm"
echo "To view logs: docker logs myagentview-modular-container"
echo "To stop: docker stop myagentview-modular-container"
echo "To remove: docker rm myagentview-modular-container"
