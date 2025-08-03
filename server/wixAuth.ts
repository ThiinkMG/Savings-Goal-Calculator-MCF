import { createClient, OAuthStrategy } from '@wix/sdk';
import { members } from '@wix/members';
import { redirects } from '@wix/redirects';

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID || '';
const WIX_SITE_ID = process.env.WIX_SITE_ID || '';

// For OAuth flow, we only need CLIENT_ID
if (!WIX_CLIENT_ID) {
  throw new Error('WIX_CLIENT_ID must be provided');
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
  // For Wix Headless OAuth, we need to use the SDK's token exchange
  try {
    const tokens = await wixClient.auth.getMemberTokens(code, 'CSRFState', {
      clientId: WIX_CLIENT_ID,
      redirectUri
    });
    
    return {
      access_token: tokens.accessToken.value,
      refresh_token: tokens.refreshToken?.value || ''
    };
  } catch (error) {
    console.error('Token exchange failed:', error);
    
    // Fallback to direct API call if SDK fails
    const tokenUrl = 'https://www.wixapis.com/oauth/access';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: WIX_CLIENT_ID,
        client_secret: process.env.WIX_OAUTH_CLIENT_SECRET || '',
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }
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
  const tokenUrl = 'https://www.wixapis.com/oauth/access';
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: WIX_CLIENT_ID,
      client_secret: process.env.WIX_OAUTH_CLIENT_SECRET || '',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}