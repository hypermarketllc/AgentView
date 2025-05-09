@echo off
setlocal

:: Run the modular server locally
echo Starting modular server locally...
node run-modular-server.js

:: This script will block until the server is stopped with Ctrl+C

endlocal
