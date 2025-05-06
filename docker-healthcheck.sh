#!/bin/sh
# Docker healthcheck script for MyAgentView CRM application

# Exit immediately if a command exits with a non-zero status
set -e

# Default values
HEALTH_ENDPOINT=${HEALTH_ENDPOINT:-"/api/health"}
TIMEOUT=${TIMEOUT:-5}
HOST=${HOST:-"localhost"}
PORT=${PORT:-3000}

# Function to display usage information
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -h, --host HOST      Host to check (default: localhost)"
  echo "  -p, --port PORT      Port to check (default: 3000)"
  echo "  -e, --endpoint PATH  Health endpoint path (default: /api/health)"
  echo "  -t, --timeout SEC    Timeout in seconds (default: 5)"
  echo "  --help               Display this help message"
  exit 1
}

# Parse command line arguments
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--host)
      HOST="$2"
      shift 2
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -e|--endpoint)
      HEALTH_ENDPOINT="$2"
      shift 2
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Construct the URL
URL="http://${HOST}:${PORT}${HEALTH_ENDPOINT}"

echo "Checking health at: ${URL}"

# Perform the health check
response=$(wget -q -O - --timeout=${TIMEOUT} --tries=1 ${URL} || echo "FAILED")

# Check if the request failed
if [ "$response" = "FAILED" ]; then
  echo "Health check failed: Could not connect to ${URL}"
  exit 1
fi

# Check if the response contains the expected status
if echo "$response" | grep -q '"status":"ok"'; then
  echo "Health check passed: Service is healthy"
  exit 0
else
  echo "Health check failed: Unexpected response: ${response}"
  exit 1
fi