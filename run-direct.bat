@echo off
REM Script to run the MyAgentView CRM application directly without Docker

echo =====================================
echo   MyAgentView CRM - Direct Deployment
echo =====================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed. Please install it and try again.
  exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: npm is not installed. Please install it and try again.
  exit /b 1
)

REM Load environment variables from .env.local
if exist .env.local (
  echo Loading environment variables from .env.local...
  for /f "tokens=*" %%a in (.env.local) do (
    set "%%a"
  )
) else (
  echo Warning: .env.local file not found. Using default environment variables.
)

REM Check if Supabase environment variables are set
if "%VITE_SUPABASE_URL%"=="" (
  echo Error: Supabase environment variables are not set.
  echo Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local file.
  exit /b 1
)

if "%VITE_SUPABASE_ANON_KEY%"=="" (
  echo Error: Supabase environment variables are not set.
  echo Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local file.
  exit /b 1
)

REM Run the application
echo Starting the application...
node run-dev.js