# API Routes Fix Documentation

## Overview

This document provides detailed information about the API routes that have been implemented to fix the missing API methods for the `system_health_checks`, `user_accs`, and `settings` tables.

## API Endpoints

### System Health Checks

#### GET /api/system-health-checks

Retrieves all system health checks.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "endpoint": "/api/example",
      "category": "api",
      "status": "ok",
      "response_time": 123,
      "status_code": 200,
      "created_at": "2025-05-10T00:00:00.000Z"
    },
    ...
  ]
}
```

#### GET /api/system-health-checks/:id

Retrieves a specific system health check by ID.

**Parameters:**
- `id` (UUID): The ID of the system health check to retrieve

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "endpoint": "/api/example",
    "category": "api",
    "status": "ok",
    "response_time": 123,
    "status_code": 200,
    "created_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### POST /api/system-health-checks

Creates a new system health check.

**Request Body:**
```json
{
  "endpoint": "/api/example",
  "category": "api",
  "status": "ok",
  "response_time": 123,
  "status_code": 200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "endpoint": "/api/example",
    "category": "api",
    "status": "ok",
    "response_time": 123,
    "status_code": 200,
    "created_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### DELETE /api/system-health-checks/:id

Deletes a specific system health check by ID.

**Parameters:**
- `id` (UUID): The ID of the system health check to delete

**Response:**
```json
{
  "success": true,
  "message": "System health check deleted successfully"
}
```

### User Accounts

#### GET /api/user-accs

Retrieves all user accounts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "uuid-string",
      "display_name": "John Doe",
      "theme_preference": {
        "name": "dark",
        "dark_mode": true
      },
      "notification_preferences": {
        "enabled": true,
        "email": true,
        "push": true
      },
      "created_at": "2025-05-10T00:00:00.000Z",
      "updated_at": "2025-05-10T00:00:00.000Z"
    },
    ...
  ]
}
```

#### GET /api/user-accs/:id

Retrieves a specific user account by ID.

**Parameters:**
- `id` (integer): The ID of the user account to retrieve

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "display_name": "John Doe",
    "theme_preference": {
      "name": "dark",
      "dark_mode": true
    },
    "notification_preferences": {
      "enabled": true,
      "email": true,
      "push": true
    },
    "created_at": "2025-05-10T00:00:00.000Z",
    "updated_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### POST /api/user-accs

Creates a new user account.

**Request Body:**
```json
{
  "user_id": "uuid-string",
  "display_name": "John Doe",
  "theme_preference": {
    "name": "dark",
    "dark_mode": true
  },
  "notification_preferences": {
    "enabled": true,
    "email": true,
    "push": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "display_name": "John Doe",
    "theme_preference": {
      "name": "dark",
      "dark_mode": true
    },
    "notification_preferences": {
      "enabled": true,
      "email": true,
      "push": true
    },
    "created_at": "2025-05-10T00:00:00.000Z",
    "updated_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### PUT /api/user-accs/:id

Updates a specific user account by ID.

**Parameters:**
- `id` (integer): The ID of the user account to update

**Request Body:**
```json
{
  "display_name": "John Smith",
  "theme_preference": {
    "name": "light",
    "dark_mode": false
  },
  "notification_preferences": {
    "enabled": false,
    "email": false,
    "push": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid-string",
    "display_name": "John Smith",
    "theme_preference": {
      "name": "light",
      "dark_mode": false
    },
    "notification_preferences": {
      "enabled": false,
      "email": false,
      "push": false
    },
    "created_at": "2025-05-10T00:00:00.000Z",
    "updated_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### DELETE /api/user-accs/:id

Deletes a specific user account by ID.

**Parameters:**
- `id` (integer): The ID of the user account to delete

**Response:**
```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

### Settings

#### GET /api/settings

Retrieves all settings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "theme",
      "value": {
        "default": "light",
        "options": ["light", "dark", "system"]
      },
      "category": "appearance",
      "created_at": "2025-05-10T00:00:00.000Z",
      "updated_at": "2025-05-10T00:00:00.000Z"
    },
    ...
  ]
}
```

#### GET /api/settings/:category

Retrieves all settings in a specific category.

**Parameters:**
- `category` (string): The category of settings to retrieve

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "theme",
      "value": {
        "default": "light",
        "options": ["light", "dark", "system"]
      },
      "category": "appearance",
      "created_at": "2025-05-10T00:00:00.000Z",
      "updated_at": "2025-05-10T00:00:00.000Z"
    },
    ...
  ]
}
```

#### GET /api/settings/:category/:key

Retrieves a specific setting by category and key.

**Parameters:**
- `category` (string): The category of the setting
- `key` (string): The key of the setting

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "theme",
    "value": {
      "default": "light",
      "options": ["light", "dark", "system"]
    },
    "category": "appearance",
    "created_at": "2025-05-10T00:00:00.000Z",
    "updated_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### POST /api/settings

Creates a new setting.

**Request Body:**
```json
{
  "key": "language",
  "value": {
    "default": "en",
    "options": ["en", "fr", "es", "de"]
  },
  "category": "localization"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "key": "language",
    "value": {
      "default": "en",
      "options": ["en", "fr", "es", "de"]
    },
    "category": "localization",
    "created_at": "2025-05-10T00:00:00.000Z",
    "updated_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### PUT /api/settings/:id

Updates a specific setting by ID.

**Parameters:**
- `id` (integer): The ID of the setting to update

**Request Body:**
```json
{
  "value": {
    "default": "en-US",
    "options": ["en-US", "fr-FR", "es-ES", "de-DE"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "key": "language",
    "value": {
      "default": "en-US",
      "options": ["en-US", "fr-FR", "es-ES", "de-DE"]
    },
    "category": "localization",
    "created_at": "2025-05-10T00:00:00.000Z",
    "updated_at": "2025-05-10T00:00:00.000Z"
  }
}
```

#### DELETE /api/settings/:id

Deletes a specific setting by ID.

**Parameters:**
- `id` (integer): The ID of the setting to delete

**Response:**
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

## Implementation Details

The API routes are implemented using Express.js and are registered in the `api-registry.js` file. The handlers for these routes are defined in the following files:

- `system-health-checks-handler.js`: Handlers for system health checks routes
- `user-accs-handler.js`: Handlers for user accounts routes
- `settings-handler.js`: Handlers for settings routes

These handlers are exported from the `index.js` file in the handlers directory.

## Error Handling

All API routes include proper error handling. If an error occurs, the response will have the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication and Authorization

These API routes are protected by authentication middleware. Users must be authenticated to access these routes. Additionally, certain routes may require specific permissions.

## Testing

To test these API routes, you can use the `system-health-monitor-check.js` script, which will make requests to each endpoint and display the results.
