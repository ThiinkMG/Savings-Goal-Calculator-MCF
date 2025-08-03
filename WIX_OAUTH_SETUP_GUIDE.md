# Wix OAuth Setup Guide

## Current Status
✅ Real Wix OAuth implementation complete  
✅ Callback page created at `/wix-callback.html`  
⚠️ **Action Required**: Configure redirect URI in Wix Dashboard

## Required Wix Configuration

### Step 1: Access Your Wix OAuth App Settings
1. Go to your Wix project dashboard
2. Navigate to **Settings → Development & integrations → Headless Settings**
3. Under **Headless clients**, find your OAuth app
4. Click the **three dots** next to your app
5. Select **Settings**

### Step 2: Add Authorization Redirect URI
In the app settings, find the **URLs** section:

1. Look for **"Allowed authorization redirect URIs"**
2. Click **"Add Redirect URI"**
3. Add this exact URI:
   ```
   https://your-replit-app-url.replit.app/wix-callback.html
   ```

### Step 3: Development/Testing URI
For local testing, also add:
```
http://localhost:5000/wix-callback.html
```

## Important Notes

### URI Matching Requirements
- The redirect URI must match **exactly** (character-for-character)
- Use the full Replit app URL, not a custom domain
- Include the full path: `/wix-callback.html`

### Current Implementation
- **OAuth Flow**: Popup-based authentication
- **Callback Handler**: `/wix-callback.html` 
- **Security**: State parameter validation, CSRF protection
- **Integration**: Automatic user account creation/linking

## Testing the Setup

1. **Add the redirect URI** to your Wix app settings (Step 2 above)
2. Click **"Sign In with My College Finance"** in the app
3. The popup should now stay open and redirect to Wix login
4. After login, you'll be redirected back to the calculator

## Troubleshooting

### Popup Closes Immediately
- **Cause**: Redirect URI not configured in Wix
- **Solution**: Follow Step 2 above

### "Invalid redirect URI" Error
- **Cause**: URI mismatch between code and Wix settings
- **Solution**: Ensure exact URI match

### Authentication Succeeds But No User Data
- **Cause**: Token exchange or member info retrieval issues
- **Solution**: Check server logs for specific errors

## Current Redirect URIs to Configure

**Development:**
```
http://localhost:5000/wix-callback.html
```

**Production (replace with your actual Replit URL):**
```
https://your-app-name.replit.app/wix-callback.html
```

Once you've added the redirect URI to your Wix app settings, the OAuth flow should work properly!