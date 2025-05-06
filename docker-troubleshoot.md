# Docker Troubleshooting Guide

## Issue Identified
The error message suggests that Docker Desktop is not running or there's an issue with the Docker engine:

```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.48/containers/json?all=1&filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.oneoff%3DFalse%22%3Atrue%2C%22com.docker.compose.project%3Dagentview%22%3Atrue%2C%22com.docker.compose.service%3Dapp%22%3Atrue%7D%7D": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

## Troubleshooting Steps

1. **Check if Docker Desktop is running**
   - Look for the Docker Desktop icon in the system tray
   - If it's not running, start Docker Desktop
   - Wait for Docker Desktop to fully initialize (this may take a minute or two)

2. **Restart Docker Desktop**
   - Right-click on the Docker Desktop icon in the system tray
   - Select "Restart Docker Desktop"
   - Wait for Docker Desktop to fully restart

3. **Check Docker service status**
   - Open PowerShell as Administrator
   - Run: `Get-Service com.docker*`
   - Ensure the services are running

4. **Reset Docker Desktop**
   - Open Docker Desktop settings
   - Go to "Troubleshoot" or "Reset" section
   - Click "Reset to factory defaults"
   - Note: This will remove all containers, images, and volumes

5. **Check WSL status (if using WSL 2 backend)**
   - Open PowerShell as Administrator
   - Run: `wsl --status`
   - Ensure WSL is running properly

## After Fixing Docker

Once Docker is running properly, try running the Docker Compose command again:

```powershell
docker-compose -f docker-compose.dev.yml up --build -d
```

## Alternative Approach

If Docker continues to have issues, you can run the application directly without Docker:

1. **Install PostgreSQL locally**
   - Download and install PostgreSQL from https://www.postgresql.org/download/
   - Create a database named `crm_db`
   - Create a user `crm_user` with password `localpassword`
   - Import the database schema and data:
     - Run `psql -U crm_user -d crm_db -f supabase-export/create_tables.sql`
     - Run `psql -U crm_user -d crm_db -f supabase-export/create_auth_tables.sql`
     - Run `psql -U crm_user -d crm_db -f supabase-export/insert_data.sql`
     - Run `psql -U crm_user -d crm_db -f setup-db-permissions.sql`

2. **Update environment variables**
   - Create a `.env.local` file with:
     ```
     POSTGRES_HOST=localhost
     POSTGRES_PORT=5432
     POSTGRES_DB=crm_db
     POSTGRES_USER=crm_user
     POSTGRES_PASSWORD=localpassword
     JWT_SECRET=your_jwt_secret
     USE_POSTGRES=true
     ```

3. **Run the application**
   - Install dependencies: `npm install`
   - Build the frontend: `npm run build`
   - Start the server: `node server-postgres.js`