# Authentication System Fix Documentation

## Overview

This document explains the authentication system fix that was implemented to resolve login issues in the CRM system. The fix addresses a critical issue where users were being deleted from the database during the position data fix process.

## Problem Identified

The main issue was identified in the `fix-position-data-complete.mjs` script, which was using a `TRUNCATE positions RESTART IDENTITY CASCADE` command. The `CASCADE` option was causing the users table to be truncated as well due to the foreign key constraint between the users and positions tables.

This resulted in:
1. Users being deleted from the database
2. Authentication failures with 401 Unauthorized errors
3. "User not found" errors in the server logs

## Solution Implemented

A comprehensive fix was implemented in the `fix-auth-system.mjs` script, which:

1. Ensures the users table exists with the correct schema
2. Creates default users if they don't exist
3. Updates existing users with correct password hashes
4. Ensures users have valid position_id values
5. Creates the user_positions view for efficient queries

The fix also modifies the server startup sequence to apply the authentication system fix before starting the server.

## Default Users

The system now creates two default users if they don't exist:

1. **Admin User**
   - Email: admin@americancoveragecenter.com
   - Password: Agent123!
   - Role: admin
   - Position: Admin (position_id: 6)

2. **Agent User**
   - Email: agent@example.com
   - Password: Agent123!
   - Role: agent
   - Position: Agent (position_id: 1)

## How to Use

### Running the Fixed Authentication Server

To run the fixed authentication server, use the following command:

```bash
cd Console_Release_Complete_Package
node run_fixed_auth_server.mjs
```

Or use the batch file:

```bash
cd Console_Release_Complete_Package
run_fixed_auth_server.bat
```

### Login Credentials

Use the following credentials to log in:

- **Admin User**
  - Email: admin@americancoveragecenter.com
  - Password: Agent123!

- **Agent User**
  - Email: agent@example.com
  - Password: Agent123!

## Technical Details

### Database Schema

The users table has the following structure:

- id (integer, primary key)
- email (varchar, not null, unique)
- password (varchar, not null)
- full_name (varchar, not null)
- role (varchar, not null)
- created_at (timestamp)
- updated_at (timestamp)
- last_login (timestamp)
- is_active (boolean)
- reset_token (varchar)
- reset_token_expires (timestamp)
- position_id (integer, foreign key to positions.id)

### Authentication Flow

1. User submits login credentials (email and password)
2. Server validates credentials against the users table
3. If valid, a JWT token is generated and returned to the client
4. The client stores the token and includes it in the Authorization header for subsequent requests
5. The server validates the token for protected routes

### Position System Integration

The authentication system is integrated with the position system:

1. Each user has a position_id that references the positions table
2. The user_positions view joins users and positions for efficient queries
3. Position data is included in the user object returned by the authentication API
4. The frontend uses position data to determine user permissions and access control

## Troubleshooting

If you encounter authentication issues:

1. Check if the users exist in the database using the `check-db-users.mjs` script:
   ```bash
   node check-db-users.mjs
   ```

2. Verify that the password hashes are correct:
   ```bash
   node test-password-hash.mjs
   ```

3. Test the authentication flow:
   ```bash
   node test-auth-flow.mjs
   ```

4. Check the server logs for any errors related to authentication.

## Future Improvements

1. Implement password reset functionality
2. Add multi-factor authentication
3. Improve error handling and user feedback
4. Add rate limiting to prevent brute force attacks
5. Implement account lockout after multiple failed login attempts
