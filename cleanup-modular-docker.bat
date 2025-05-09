@echo off
setlocal

:: Script to clean up Docker containers and images for the modular server

echo Stopping modular Docker container if running...
docker stop myagentview-modular-container 2>nul || echo Container not running.

echo Removing modular Docker container if it exists...
docker rm myagentview-modular-container 2>nul || echo Container does not exist.

echo Removing modular Docker image if it exists...
docker rmi myagentview-modular 2>nul || echo Image does not exist.

echo Cleanup complete.
echo You can now run run-modular-docker.bat to build and run a fresh container.

endlocal
