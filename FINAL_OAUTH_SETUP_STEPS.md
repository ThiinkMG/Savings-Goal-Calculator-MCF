# Final OAuth Setup Steps

## ✅ Completed
- OAuth app created in Wix: "Savings Goal Calculator"
- Client ID updated: `294a4d93-c607-4962-b2af-5b0fde201848`
- Callback page ready at: `/wix-callback.html`

## 🔧 One Final Step Required

### Add Redirect URI in Wix Dashboard

1. **Go back to your Wix dashboard**
2. Navigate to **Settings → Development & integrations → Headless Settings**
3. Find your **"Savings Goal Calculator"** app
4. Click the **three dots** (⋯) next to it
5. Select **"Settings"**
6. Find the **"URLs"** section
7. Look for **"Allowed authorization redirect URIs"**
8. Click **"Add Redirect URI"**
9. Add this exact URI:
   ```
   http://localhost:5000/wix-callback.html
   ```
10. **Save the settings**

## 🧪 Test Authentication

After adding the redirect URI:

1. Click **"Sign In with My College Finance"** in the app
2. The popup should stay open (not close immediately)
3. You'll see the Wix login page
4. After logging in, you'll be redirected back to the calculator

## ⚠️ If Still Having Issues

- Double-check the redirect URI is exactly: `http://localhost:5000/wix-callback.html`
- Ensure there are no extra spaces or characters
- Make sure you saved the settings in Wix

The OAuth integration is technically complete - this final redirect URI configuration will make it work properly.