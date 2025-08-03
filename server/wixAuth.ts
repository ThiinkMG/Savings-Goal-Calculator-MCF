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

// Generate Wix Headless OAuth authorization URL for member login
export function generateWixAuthUrl(state: string, redirectUri: string): string {
  // Use the standard Wix OAuth authorization endpoint
  const authUrl = new URL('https://www.wix.com/oauth/authorize');
  authUrl.searchParams.set('client_id', WIX_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'offline_access');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  
  return authUrl.toString();
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