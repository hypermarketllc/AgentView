@echo off
setlocal enabledelayedexpansion

echo ----------------------------------------
echo ✅ Verifying required files...
echo ----------------------------------------

set count=0

REM Loop through the file list
for %%F in (
    "docs\Console_Master_Implementation_Guide_DETAILED.md"
    "docs\ContributorChecklist.md"
    "docs\release-checklist.md"
    "docs\Console_Implementation_Tracker.tsv"
    "docs\release.config.json"
    "docs\build-prod.sh"
    "docs\cline-rules.md"
    "docs\cline-rules-checklist.md"
    "scripts\dev-check.ts"
    "scripts\dev-start.ts"
    "scripts\setEnv.ts"
    "tools\patch\runPatch.ts"
    "tools\patch\patch-env-validator.ts"
    "tools\patch\patch-express-404-handler.ts"
    "tools\patch\validateRouteRegistry.ts"
    "tools\patch\validate-api-responses.ts"
    "tools\patch\fixMissingLimitQueries.ts"
    "tools\patch\detectDuplicateFunctions.ts"
    "middleware\requirePermission.ts"
    "middleware\errorHandler.ts"
    "utils\logErrorToDB.ts"
    "frontend\components\StartConsolePanel.tsx"
    "frontend\components\LogsPanel.tsx"
    "frontend\components\ErrorPanel.tsx"
    "frontend\components\ErrorLogPanel.tsx"
    "frontend\layouts\ConsoleDashboardLayout.tsx"
    "server\routes\consoleRoutes.ts"
    "server\routes\consoleFixRoute.ts"
    "server\routes\errorLogRoute.ts"
    "server\routes\consolePatchHandler.ts"
    "server\routes\routeRegistry.ts"
    "server\integrations\consoleRoutes.ts"
    "server\websocket\logSocketServer.ts"
    "modules\index.ts"
    "docker-compose.console.yml"
    "Dockerfile.console"
    "docker\healthcheck.sh"
    "db\migrations\2025_add_user_role_column.sql"
    "db\migrations\system_errors.sql"
    "db\seeds\roles.sql"
    "logs\PatchVersionLog.json"
    ".env.docker"
) do (
    set /a count+=1
    if exist "%%F" (
        echo [✓] %%F
    ) else (
        echo [X] %%F -- MISSING
    )
)

echo ----------------------------------------
echo ✔️  Checked !count! files
echo ----------------------------------------
pause
