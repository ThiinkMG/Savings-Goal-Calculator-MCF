# Quick OAuth Guide for Wix Website Connection

## Your Current Situation

You have:
- ✅ A Wix website (not an app)
- ✅ A Client ID: `2583909e-4c0c-429e-b4d3-8d58e7096828`
- ❌ Missing: Client Secret

## What to Tell Wix Support

"I have a Wix website and I'm building an external web application that needs to authenticate my website members using OAuth. I have a Client ID (2583909e-4c0c-429e-b4d3-8d58e7096828) but I need:

1. To verify if this Client ID is registered in the Developer Center
2. The Client Secret associated with this Client ID
3. To confirm the app type (OAuth vs Headless)

I'm NOT trying to:
- Build something inside Wix
- Use Wix's SSO for organizations
- Create a Wix app to sell in the marketplace

I AM trying to:
- Build an external web app on Replit
- Let my Wix website members log into this external app
- Access their member data through Wix APIs"

## If They Ask for Technical Details

The OAuth flow I'm implementing:
1. User visits my external app
2. Clicks "Login with Wix"
3. Gets redirected to: `https://www.wix.com/oauth/authorize`
4. After login, Wix redirects back to my app with an auth code
5. I exchange the code for tokens at: `https://www.wixapis.com/oauth/access`
6. Use the access token to call Wix APIs

## Quick Test Once You Have Client Secret

1. Visit: `/wix-oauth-test.html` in your app
2. Enter the Client Secret
3. Click "Generate Auth URL"
4. Complete the flow

## Alternative: Create New App

If Wix can't find your Client ID, you may need to:
1. Go to https://dev.wix.com
2. Create new app → Website/Business App → Client-side app
3. Get new Client ID and Secret
4. Update the code with new Client ID