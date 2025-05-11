@echo off
REM run_server_with_error_logging.bat
REM Script to run the server with error logging enabled

echo Starting server with error logging enabled...

REM Set environment variables
set ERROR_LOGGING_ENABLED=true

REM Run the Node.js script
node Console_Release_Complete_Package\run_server_with_error_logging.js

pause
