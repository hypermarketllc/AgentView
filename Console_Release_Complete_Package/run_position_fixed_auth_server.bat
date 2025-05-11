@echo off
REM Script to run the fixed authentication server with comprehensive position fix
echo Starting fixed authentication server with comprehensive position fix...

REM Step 1: Apply database position fix
echo Step 1: Applying database position fix...
node fix-position-data-complete.mjs
if %ERRORLEVEL% NEQ 0 (
  echo Database position fix failed with error code %ERRORLEVEL%
  pause
  exit /b %ERRORLEVEL%
)

REM Step 2: Apply enhanced frontend position fix
echo Step 2: Applying enhanced frontend position fix...
node fix-frontend-position-id-enhanced.mjs
if %ERRORLEVEL% NEQ 0 (
  echo Enhanced frontend position fix failed with error code %ERRORLEVEL%
  echo Continuing with server startup...
)

REM Step 3: Apply auth API enhancements
echo Step 3: Applying auth API enhancements...
node enhance-auth-api.mjs
if %ERRORLEVEL% NEQ 0 (
  echo Auth API enhancement failed with error code %ERRORLEVEL%
  echo Continuing with server startup...
)

REM Step 4: Apply position fix
echo Step 4: Applying position fix...
node position-fix\main.mjs
if %ERRORLEVEL% NEQ 0 (
  echo Position fix failed with error code %ERRORLEVEL%
  echo Continuing with server startup...
)

REM Step 5: Start authentication server
echo Step 5: Starting enhanced authentication server...
node run_enhanced_auth_server.mjs
