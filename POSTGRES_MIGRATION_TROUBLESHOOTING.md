# PostgreSQL Migration Troubleshooting Guide

This document provides solutions for common issues encountered when migrating from Supabase to PostgreSQL.

## Authentication Issues

### 1. "Invalid email or password" Error

**Problem**: Users receive "Invalid email or password" error even when the account exists.

**Solution**: We've updated the error messages to be more specific:
- "Account not found. Please check your email or register." - When the email doesn't exist
- "Authentication error. Please contact support." - When the user exists but has no auth record
- "Invalid password. Please try again." - When the password is incorrect

### 2. Admin Account Login Issues

**Problem**: The admin@americancoveragecenter.com account exists in the users table but login fails.

**Solution**: We've created scripts to check and fix admin authentication:

```bash
# Windows
run-check-admin-auth.bat

# Unix/Linux/Mac
./run-check-admin-auth.sh
```

This script:
1. Checks if admin@americancoveragecenter.com exists in the users table
2. Checks if it has a corresponding entry in the auth_users table
3. Creates the auth_users entry if missing
4. Updates the password hash to match "Discord101!"

### 3. Database Connection Issues

**Problem**: The application can't connect to the PostgreSQL database.

**Solution**: We've fixed the typo in the .env file (changed "strongtt" to "strong") and created a diagnostic script:

```bash
# Windows
run-check-db-connection.bat

# Unix/Linux/Mac
./run-check-db-connection.sh
```

This script:
1. Displays the current database connection parameters
2. Tests the connection to PostgreSQL
3. Checks if the auth_users table exists and shows its structure
4. Lists all auth_users (with password hash previews)
5. Verifies if the admin account exists in both tables

## Frontend Issues

### MIME Type Error for JavaScript Modules

**Problem**: "Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of 'text/html'"

**Solution**: We've updated the server-postgres-docker.js file to:
1. Properly set the Content-Type header for JavaScript module files
2. Add better logging for asset requests
3. Add a diagnostic endpoint at /crm/api/check-mime to verify MIME type handling

To test the MIME type handling:
1. Start the server with `npm run dev`
2. Visit http://localhost:3000/crm/api/check-mime in your browser
3. You should see a JSON response confirming MIME type handling is active

## How to Use the Troubleshooting Scripts

### Check Database Connection

```bash
# Windows
run-check-db-connection.bat

# Unix/Linux/Mac
./run-check-db-connection.sh
```

This script will output detailed information about your database connection, tables, and user accounts.

### Fix Admin Authentication

```bash
# Windows
run-check-admin-auth.bat

# Unix/Linux/Mac
./run-check-admin-auth.sh
```

This script will ensure the admin@americancoveragecenter.com account has a proper auth_users entry with the correct password hash.

## Verifying the Fix

After applying these fixes:

1. Restart the server with `npm run dev`
2. Try logging in with admin@americancoveragecenter.com and password Discord101!
3. Check the server logs for detailed authentication information
4. If you still encounter issues, run the diagnostic scripts again to verify the state of the database

## Common Error Messages and Solutions

| Error Message | Possible Cause | Solution |
|---------------|----------------|----------|
| "Account not found" | Email doesn't exist in users table | Register the account or check for typos |
| "Authentication error" | User exists but no auth record | Run the check-admin-auth script |
| "Invalid password" | Password doesn't match the hash | Use the correct password or reset it |
| "Failed to load module script" | MIME type issue | Restart the server after applying the fixes |
| "Database connection error" | Incorrect PostgreSQL settings | Check .env file and run check-db-connection |

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Static Files](https://expressjs.com/en/starter/static-files.html)
- [JWT Authentication Guide](https://jwt.io/introduction/)
