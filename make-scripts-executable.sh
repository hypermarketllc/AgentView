#!/bin/bash

# Make all the modular server scripts executable
chmod +x run-modular-docker.sh
chmod +x run-modular-server.sh
chmod +x cleanup-modular-docker.sh

echo "Scripts are now executable."
echo "You can now run:"
echo "  ./run-modular-docker.sh - to build and run the modular server in Docker"
echo "  ./run-modular-server.sh - to run the modular server locally"
echo "  ./cleanup-modular-docker.sh - to clean up Docker containers and images"
