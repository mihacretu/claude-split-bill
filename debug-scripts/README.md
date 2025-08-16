# Debug Scripts

This folder contains development and testing scripts that were used during the setup and debugging of the application.

## Files

- **debug-auth.js** - Debug script for authentication with detailed error information
- **test-auth-flow.js** - Tests the complete Supabase authentication flow (signup, signin, password reset)
- **test-email-domains.js** - Tests email domain restrictions in Supabase auth
- **test-project-info.js** - Retrieves and displays Supabase project information
- **test-storage.js** - Tests the storage adapter functionality for session persistence
- **test-supabase.js** - Tests basic Supabase connectivity and configuration

## Usage

These scripts can be run individually using Node.js:

```bash
cd debug-scripts
node test-supabase.js
node test-auth-flow.js
# etc...
```

## Purpose

These scripts were created during development to:
- Test Supabase integration and connectivity
- Debug authentication issues
- Verify configuration settings
- Test different email domains and restrictions

## Note

These are development tools and should not be deployed to production. The main application tests are located in `backend/test/`.
