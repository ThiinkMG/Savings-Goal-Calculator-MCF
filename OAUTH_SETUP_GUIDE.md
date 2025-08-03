# OAuth Integration Setup Guide

## Current Status: Demo Mode

The OAuth integration is currently running in **demo mode** to showcase the functionality. To implement the full OAuth flow with your actual MyCollegeFinance.com website, follow these steps:

## 1. Create OAuth Endpoint on MyCollegeFinance.com

Create a new page at `/auth/app-login` on your Wix website with the following functionality:

### URL Parameters Expected:
- `state`: Security parameter to prevent CSRF attacks
- `redirect_uri`: Callback URL for the app (currently not used in popup flow)
- `app_name`: Identifier for the requesting app (`savings_calculator`)

### Page Implementation:
```html
<!-- Create this page at mycollegefinance.com/auth/app-login -->
<script>
// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const state = urlParams.get('state');
const appName = urlParams.get('app_name');

// Your existing Wix authentication logic here
// When user successfully logs in:

function onSuccessfulLogin(userProfile) {
  // Send success message back to popup opener
  window.opener.postMessage({
    type: 'AUTH_SUCCESS',
    data: {
      code: 'auth-code-from-wix-' + Date.now(),
      state: state,
      memberId: userProfile.id,
      email: userProfile.email,
      profile: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        nickname: userProfile.nickname
      }
    }
  }, '*');
  window.close();
}

function onLoginCancel() {
  window.opener.postMessage({
    type: 'AUTH_CANCELLED'
  }, '*');
  window.close();
}

function onLoginError(error) {
  window.opener.postMessage({
    type: 'AUTH_ERROR',
    data: { message: error.message }
  }, '*');
  window.close();
}
</script>
```

## 2. Update OAuth URL in App

Once the OAuth endpoint is live, update `client/src/components/EnhancedAuthModal.tsx`:

```typescript
// Replace the demo authUrl with:
const authUrl = `https://mycollegefinance.com/auth/app-login?` +
  `state=${state}&` +
  `redirect_uri=${encodeURIComponent(appCallbackUrl)}&` +
  `app_name=savings_calculator`;

// Update origin verification:
if (event.origin !== 'https://mycollegefinance.com') {
  console.warn('Received message from unauthorized origin:', event.origin);
  return;
}
```

## 3. Security Considerations

- **State Parameter**: Always validate the state parameter to prevent CSRF attacks
- **Origin Verification**: Only accept messages from trusted origins
- **HTTPS Only**: Ensure all OAuth communication happens over HTTPS
- **Session Management**: Properly handle session creation and validation

## 4. Testing Checklist

- [ ] OAuth page responds correctly at `/auth/app-login`
- [ ] Popup window opens and displays login form
- [ ] Successful login sends correct message format
- [ ] Cancel/error scenarios handled properly
- [ ] State parameter validation works
- [ ] User creation/linking in app database
- [ ] Session management functions correctly

## 5. Production Deployment

1. Remove demo mode indicators from UI
2. Update origin verification to production domain
3. Test with real user accounts
4. Monitor OAuth flow analytics
5. Set up error logging and monitoring

## Current Demo Features

The current implementation includes:
- ✅ Popup-based OAuth flow simulation
- ✅ State parameter generation and validation
- ✅ Message-based communication between popup and app
- ✅ User creation and account linking
- ✅ Session management
- ✅ Error handling and user feedback
- ✅ Mobile-responsive design

## Support

For questions about implementing the OAuth endpoint on your Wix website, refer to:
- Wix Developer Documentation
- OAuth 2.0 Specification
- This app's OAuth callback endpoint: `/api/auth/wix-callback`