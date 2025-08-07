# Final OAuth Setup Steps

## ✅ What's Already Done
1. **OAuth App Created**: "Savings Goal Calculator" app exists in Wix
2. **Client ID Configured**: `294a4d93-c607-4962-b2af-5b0fde201848`
3. **Localhost URI Added**: `http://localhost:5000/wix-callback.html`
4. **Wix Site Published**: Site is now live and can handle OAuth

## 🔧 Required Actions

### 1. Add Production Redirect URI
In your Wix Dashboard:
1. Go to **Settings → Development & integrations → Headless Settings**
2. Find your "Savings Goal Calculator" OAuth app
3. Click the three dots → **Settings**
4. In the **URLs** section under **Allowed authorization redirect URIs**
5. Click **Add Redirect URI** and add:
   ```
   https://e05d90d9-c797-41b7-aca1-f157cdb8f34e-00-8dkl743gvlgl.worf.replit.dev/wix-callback.html
   ```

### 2. Check for Client Secret (if needed)
While in the OAuth app settings, check if there's a **Client Secret**:
- If yes: Copy it and I'll help you add it as a secret
- If no: We can proceed without it

### 3. Verify OAuth Scopes
Ensure your OAuth app has the necessary scopes:
- **offline_access** (for refresh tokens)
- **members:read** (to get member information)

## 🧪 Testing After Setup

Once you've added the production redirect URI:
1. Click "Sign In with My College Finance"
2. You should be redirected to the Wix login page
3. After logging in, you'll be redirected back to the app
4. The app will automatically log you in

## 🚨 Troubleshooting

### If you still get "refused to connect":
- Double-check the redirect URI is exactly as shown above
- Ensure there are no trailing slashes or spaces
- Try clearing your browser cache

### If you get "Invalid redirect URI":
- The URI in Wix must match exactly what we're sending
- Check for typos or extra characters

Let me know once you've added the production redirect URI, and tell me if you found a Client Secret!