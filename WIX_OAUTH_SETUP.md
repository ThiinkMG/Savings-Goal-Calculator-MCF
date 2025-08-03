# Wix OAuth Setup Guide

This guide explains how to set up and use Wix OAuth authentication in your application.

## Overview

The application supports Wix OAuth for connecting to Wix websites and accessing member data. The OAuth flow allows users to log in with their Wix account credentials.

## Current Configuration

- **Client ID**: `2583909e-4c0c-429e-b4d3-8d58e7096828` (already configured)
- **Client Secret**: You need to obtain this from your Wix app settings

## Setup Steps

### 1. Get Your Client Secret

To complete the OAuth setup, you need your Wix App Secret Key:

1. Go to the [Wix Dev Center](https://dev.wix.com)
2. Open your app
3. Navigate to OAuth settings
4. Copy your App Secret Key

### 2. Test the OAuth Flow

#### Option A: Use the Test Page (Recommended)

1. Navigate to: `/wix-oauth-test.html`
2. Enter your Client Secret
3. Click "Generate Auth URL"
4. Follow the authorization flow
5. Exchange the code for tokens

#### Option B: Use the Login Modal

1. Click the "Sign In" button in your app
2. Choose "Continue with My College Finance"
3. You'll be redirected to Wix for authentication
4. After successful login, you'll be redirected back

#### Option C: Manual Token Exchange (Command Line)

Use the provided script:

```bash
./test-wix-oauth.sh
```

Or use curl directly:

```bash
curl -X POST https://www.wixapis.com/oauth/access \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "2583909e-4c0c-429e-b4d3-8d58e7096828",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "YOUR_AUTH_CODE"
  }'
```

## OAuth Flow Explained

1. **User Initiates Login**: User clicks "Continue with My College Finance"
2. **Generate Auth URL**: App creates a secure OAuth URL with state parameter
3. **Redirect to Wix**: User is redirected to Wix login page
4. **User Authorizes**: User logs in and grants permissions
5. **Redirect Back**: Wix redirects back to `/wix-callback.html` with auth code
6. **Exchange Code**: App exchanges the auth code for access tokens
7. **Create Session**: App creates user session and stores tokens

## API Endpoints

### Generate OAuth URL
```
POST /api/auth/wix-auth-url
Body: { state: "random-string", redirectUri: "https://yourapp.com/wix-callback.html" }
```

### Exchange Code for Tokens
```
POST /api/auth/wix-callback
Body: { code: "auth-code", state: "state-param", redirectUri: "callback-url" }
```

### Test Token Exchange
```
POST /api/auth/wix-exchange-token
Body: { code: "auth-code", client_secret: "your-secret" }
```

## Security Considerations

- State parameter is used to prevent CSRF attacks
- Tokens are stored securely in session
- Client Secret should never be exposed to frontend
- Always use HTTPS in production

## Troubleshooting

### Common Issues

1. **"Invalid client_id"**: Verify your Client ID is correct
2. **"Invalid client_secret"**: Check your Client Secret
3. **"Invalid authorization code"**: Code may be expired or already used
4. **CORS errors**: Use server-side endpoints instead of direct API calls

### Debug Steps

1. Check browser console for errors
2. Verify redirect URI matches exactly
3. Ensure state parameter matches
4. Check server logs for detailed error messages

## Next Steps

Once OAuth is working:
1. Users can log in with their Wix credentials
2. App can access member data from Wix
3. Goals and data can be synced between platforms