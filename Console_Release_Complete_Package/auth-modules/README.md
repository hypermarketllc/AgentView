# Modular Auth Provider Fix

## Overview

This directory contains a modular implementation of the authentication provider fix for the CRM application. The code has been split into multiple modules, each with a specific responsibility, to improve maintainability and readability.

## Modules

### 1. auth-provider-core.mjs

This module provides shared utilities and constants used by other modules. It handles:
- File system imports
- Path resolution
- Common constants

### 2. auth-provider-script-generator.mjs

This module generates the JavaScript code that will be injected into the HTML file. It includes:
- Token storage functions
- Network request interception (fetch and XMLHttpRequest)
- UI components for token management
- Event handlers for the UI components

### 3. auth-provider-injector.mjs

This module handles injecting the generated script into the HTML file. It:
- Reads the index.html file
- Checks if the fix has already been applied
- Injects the script at the beginning of the `<head>` tag
- Writes the modified HTML back to the file

### 4. auth-provider-api-url-fixer.mjs

This module fixes API URLs in the frontend code. It:
- Analyzes API endpoints in the frontend code
- Fixes API URLs that don't include the correct prefix
- Checks for axios base URL configuration

### 5. auth-provider-main.mjs

This is the main module that orchestrates the entire fix process. It:
- Imports and executes all the other modules
- Provides a step-by-step execution flow
- Handles error reporting and success status

## How It Works

The auth provider fix addresses several issues with the authentication system:

1. **Token Storage**: The fix ensures tokens are stored in multiple locations (localStorage, sessionStorage, and cookies) for maximum compatibility.

2. **Network Interception**: It intercepts all network requests (both fetch and XMLHttpRequest) to automatically add the Authorization header with the token for API requests.

3. **Form Detection**: It detects login form submissions and ensures the token is properly stored after successful login.

4. **UI Tools**: It adds a floating button that provides tools for token management, including viewing, saving, clearing, and testing the token.

5. **API URL Fixing**: It ensures all API URLs include the correct prefix (/crm/api) to match the server's routing.

## Usage

The fix is automatically applied when running the authentication server using the `run_fixed_auth_server.mjs` script. You can also run it directly:

```bash
node auth-modules/auth-provider-main.mjs
```

## Troubleshooting

If you encounter issues with the authentication system, you can use the floating token management button (🔑) that appears in the bottom-right corner of the application. This tool allows you to:

1. View the current token
2. Manually set a new token
3. Clear the token
4. Test authentication with the current token

## Development

To modify or extend the auth provider fix:

1. Make changes to the appropriate module based on what you need to modify
2. Test your changes by running the auth-provider-main.mjs script
3. Update this documentation if you add new features or change existing behavior
