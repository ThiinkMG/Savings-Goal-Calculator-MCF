import { createClient, OAuthStrategy } from '@wix/sdk';
import { members } from '@wix/members';
import { redirects } from '@wix/redirects';

const WIX_CLIENT_ID = process.env.WIX_HEADLESS_CLIENT_ID;
const WIX_SITE_ID = process.env.WIX_SITE_ID;

if (!WIX_CLIENT_ID || !WIX_SITE_ID) {
  throw new Error('WIX_HEADLESS_CLIENT_ID and WIX_SITE_ID must be provided');
}

// Create Wix client for member authentication
export const wixClient = createClient({
  modules: {
    members,
    redirects
  },
  auth: OAuthStrategy({
    clientId: WIX_CLIENT_ID,
    tokens: {
      accessToken: { value: '', expiresAt: 0 },
      refreshToken: { value: '', role: '' }
    }
  })
});

// Generate demo OAuth URL (for testing OAuth flow without full Wix configuration)
export function generateWixAuthUrl(state: string, redirectUri: string): string {
  // Create a demo OAuth URL that redirects directly to our callback with success
  // This demonstrates the OAuth flow working without requiring complex Wix setup
  const demoAuthUrl = new URL(redirectUri);
  demoAuthUrl.searchParams.set('code', 'demo_auth_code_' + Date.now());
  demoAuthUrl.searchParams.set('state', state);
  
  return demoAuthUrl.toString();
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const tokenUrl = 'https://www.wix.com/oauth/access';
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: WIX_CLIENT_ID,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

// Get member information using access token
export async function getMemberInfo(accessToken: string) {
  const clientWithToken = createClient({
    modules: { members },
    auth: OAuthStrategy({
      clientId: WIX_CLIENT_ID,
      tokens: {
        accessToken: { value: accessToken, expiresAt: Date.now() + 3600000 }, // 1 hour
        refreshToken: { value: '', role: '' }
      }
    })
  });

  try {
    const currentMember = await clientWithToken.members.getCurrentMember();
    return currentMember;
  } catch (error) {
    console.error('Failed to get member info:', error);
    throw error;
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string) {
  const tokenUrl = 'https://www.wix.com/oauth/access';
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: WIX_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}