#!/bin/bash

# Wix OAuth Token Exchange Script
# This script helps you manually exchange an authorization code for access tokens

echo "Wix OAuth Token Exchange Helper"
echo "==============================="
echo ""

# Default values - use environment variable for security
CLIENT_ID="${WIX_CLIENT_ID:-}"
AUTH_ENDPOINT="https://www.wixapis.com/oauth/access"

# Validate that CLIENT_ID is provided
if [ -z "$CLIENT_ID" ]; then
    echo "Error: WIX_CLIENT_ID environment variable is not set."
    echo "Please set it with: export WIX_CLIENT_ID=your-client-id"
    exit 1
fi

echo "Current Configuration:"
echo "Client ID: $CLIENT_ID"
echo ""

# Prompt for client secret
echo -n "Enter your Client Secret (App Secret Key): "
read -s CLIENT_SECRET
echo ""

# Prompt for authorization code
echo -n "Enter the Authorization Code: "
read AUTH_CODE
echo ""

echo "Exchanging code for tokens..."
echo ""

# Make the API call
RESPONSE=$(curl -X POST "$AUTH_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"grant_type\": \"authorization_code\",
    \"client_id\": \"$CLIENT_ID\",
    \"client_secret\": \"$CLIENT_SECRET\",
    \"code\": \"$AUTH_CODE\"
  }" 2>/dev/null)

# Check if curl was successful
if [ $? -eq 0 ]; then
    echo "Response from Wix API:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    
    # Try to extract tokens
    ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refresh_token"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$ACCESS_TOKEN" ]; then
        echo ""
        echo "Success! Tokens extracted:"
        echo "========================="
        echo "Access Token: $ACCESS_TOKEN"
        echo "Refresh Token: $REFRESH_TOKEN"
        echo ""
        echo "You can now use these tokens in your application."
    fi
else
    echo "Error: Failed to make API request"
fi