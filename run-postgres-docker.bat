@echo off

REM Check if .env file exists, if not create from example
if not exist .env (
  if exist .env.postgres.example (
    echo Creating .env file from .env.postgres.example...
    copy .env.postgres.example .env
  ) else (
    echo Warning: .env.postgres.example not found. Please create a .env file manually.
  )
)

REM Build the frontend
echo Building frontend...
call npm run build

REM Set environment variables for PostgreSQL
set USE_POSTGRES=true
set VITE_USE_POSTGRES=true
set NODE_ENV=development

REM Apply deep patch to path-to-regexp
echo Applying deep patch to path-to-regexp library...
node path-to-regexp-deep-patch.mjs

REM Start the server
echo Starting server with PostgreSQL...
echo Using path-to-regexp patch to handle invalid route patterns...
node server-postgres-docker.js
