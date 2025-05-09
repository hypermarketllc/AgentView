# PostgreSQL Migration Adapter

This document explains the implementation of the Supabase to PostgreSQL adapter that enables seamless migration from Supabase to a PostgreSQL database.

## Overview

The application was originally built using Supabase as the backend database service. To migrate to a PostgreSQL database, we needed to create a compatibility layer that mimics the Supabase client API but redirects calls to our REST API endpoints that connect to PostgreSQL.

## Implementation Details

### 1. Supabase PostgreSQL Adapter

We created a comprehensive adapter in `src/lib/supabase-postgres-adapter.js` that implements the Supabase client API interface but redirects all calls to our REST API. This adapter:

- Provides mock data for tables that don't exist in our API
- Handles all CRUD operations (Create, Read, Update, Delete)
- Implements the Supabase auth API
- Implements the Supabase storage API
- Handles RPC (Remote Procedure Call) functions

### 2. TypeScript Declaration File

We created a TypeScript declaration file in `src/lib/supabase-postgres-adapter.d.ts` to define the types for our adapter, ensuring TypeScript compatibility.

### 3. Updated Supabase Client

We updated the Supabase client in `src/lib/supabase.ts` to use our adapter when the `USE_POSTGRES` or `VITE_USE_POSTGRES` environment variable is set to `true`.

## Key Features

### Mock Data for Missing Tables

The adapter provides mock data for tables that don't exist in our API but are referenced in the frontend:

```javascript
const MOCK_DATA = {
  telegram_chats: [
    { id: '1', chat_id: '123456789', name: 'Test Chat', is_active: true },
    { id: '2', chat_id: '987654321', name: 'Another Chat', is_active: false }
  ],
  integrations: [
    { id: '1', name: 'Discord', is_active: true, config: {} },
    { id: '2', name: 'Telegram', is_active: true, config: {} }
  ],
  discord_notifications: [
    { id: '1', message: 'Test notification', sent_at: new Date().toISOString(), status: 'sent' }
  ],
  settings: [
    { id: '1', key: 'system_name', value: 'CRM System', category: 'system' },
    { id: '2', key: 'notification_enabled', value: 'true', category: 'notifications' }
  ]
};
```

### API Call Redirection

The adapter redirects Supabase client API calls to our REST API endpoints:

```javascript
case 'carriers':
  const carriersResponse = await api.get('/carriers');
  data = carriersResponse.data;
  break;
case 'products':
  if (filter && filter.column === 'carrier_id') {
    const productsResponse = await api.get(`/products?carrierId=${filter.value}`);
    data = productsResponse.data;
  } else {
    const productsResponse = await api.get('/products');
    data = productsResponse.data;
  }
  break;
```

### Authentication Handling

The adapter implements the Supabase auth API to handle authentication:

```javascript
signIn: ({ email, password }) => {
  console.log('Auth API: signIn called');
  return new Promise(async (resolve) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Save tokens to localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      
      resolve({ 
        data: { 
          user: response.data.user,
          session: {
            access_token: response.data.token,
            refresh_token: response.data.refreshToken
          }
        }, 
        error: null 
      });
    } catch (error) {
      resolve({ data: null, error: error.response?.data?.error || error.message || 'Login failed' });
    }
  });
}
```

## Usage

To use the PostgreSQL adapter instead of Supabase, set the `USE_POSTGRES` or `VITE_USE_POSTGRES` environment variable to `true` in your `.env` file:

```
USE_POSTGRES=true
```

The application will automatically use the PostgreSQL adapter instead of the Supabase client.

## Benefits

This adapter provides several benefits:

1. **Seamless Migration**: The frontend code doesn't need to be modified to work with PostgreSQL.
2. **Gradual Transition**: You can switch between Supabase and PostgreSQL by changing a single environment variable.
3. **Consistent API**: The adapter provides a consistent API interface, regardless of the underlying database.
4. **Mock Data**: The adapter provides mock data for tables that don't exist in the API, allowing the frontend to function correctly even if some backend features are not yet implemented.

## Future Improvements

1. **Type Safety**: Enhance the TypeScript declaration file to provide more specific types for the adapter.
2. **Performance Optimization**: Optimize the adapter to reduce API calls and improve performance.
3. **Error Handling**: Improve error handling and provide more detailed error messages.
4. **Testing**: Add unit tests for the adapter to ensure it works correctly with all Supabase client API calls.
