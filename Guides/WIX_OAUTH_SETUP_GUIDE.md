# Wix OAuth Setup Guide

## Current Status
✅ Real Wix OAuth implementation complete  
✅ Callback page created at `/wix-callback.html`  
⚠️ **Action Required**: Create OAuth app and configure redirect URIs in Wix Dashboard

## How to Register Your App on Wix

### Step 1: Create OAuth App in Wix Dashboard
1. Go to your **Wix.com account** and log in to your site dashboard
2. Navigate to **Settings → Development & integrations → Headless Settings**
3. In the **Headless clients** section, click **"Create New Client"**
4. Enter app name: **"My College Finance Calculator"**
5. Select: **"OAuth App for Visitors and Members"**
6. Click **"Create & Continue"**
7. **Copy the Client ID** - you'll need to update your secrets

### Step 2: Update Client ID Secret
✅ **Your Client ID:** `294a4d93-c607-4962-b2af-5b0fde201848`

You need to update your `WIX_HEADLESS_CLIENT_ID` secret with this value.

### Step 3: Configure Redirect URIs
In your OAuth app settings, you need to add the redirect URI:

### Step 4: Add Authorization Redirect URI
You need to go back to your Wix dashboard and add the redirect URI:

1. Go to **Settings → Development & integrations → Headless Settings**
2. Find your **"Savings Goal Calculator"** app
3. Click the **three dots** and select **Settings**
4. Find the **URLs** section
5. Look for **"Allowed authorization redirect URIs"**
6. Click **"Add Redirect URI"**
7. Add this exact URI:
   ```
   http://localhost:5000/wix-callback.html
   ```

### Step 5: Production URI (After Deployment)
Also add your production URL:
```
https://your-replit-app-url.replit.app/wix-callback.html
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