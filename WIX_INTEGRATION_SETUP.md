# Wix Website User Account Synchronization

This document explains how to set up **bidirectional** automated user account synchronization between your Wix website and the Replit database.

## Overview

The Wix integration system provides **complete bidirectional sync** capabilities:
- **Wix → Replit**: Automatically sync user accounts from Wix to Replit database
- **Replit → Wix**: Create Wix accounts when users register in the app
- **Live Updates**: Sync changes (username, email, phone) from Replit back to Wix
- Link existing users across both platforms
- Perform real-time or scheduled synchronization
- Maintain data integrity between both platforms

## Bidirectional Sync Features

### From Wix to Replit:
- Import all existing Wix members to Replit database
- Generate secure temporary passwords for new users
- Link existing Replit users to their Wix accounts

### From Replit to Wix:
- **New User Registration**: When users sign up in the app, automatically create their Wix account
- **Profile Updates**: When users update username, email, or phone in Replit, sync changes to Wix
- **Account Linking**: Automatically link new Replit users to their Wix profiles

## Required Environment Variables

You need to set the following environment variables in your Replit project:

```bash
WIX_ACCOUNT_ID=your_wix_account_id
WIX_SITE_ID=your_wix_site_id
WIX_API_KEY=your_wix_api_key_with_members_permissions
```

### How to Get Wix API Credentials:

1. **Wix Account ID**: Found in your Wix Dashboard under Account Settings
2. **Wix Site ID**: Available in your site's dashboard URL or site settings
3. **Wix API Key**: Generate from Wix Developers Console with the following permissions:
   - `members.members:read` - To read member data
   - `members.members:write` - To update member data (optional)

## API Endpoints

### Test Connection
```bash
GET /api/admin/wix/test
```
Tests if the Wix API credentials are working properly.

### Sync All Users
```bash
POST /api/admin/wix/sync
```
Synchronizes all users from Wix to the Replit database. This will:
- Create new users for Wix members not in Replit
- Link existing Replit users to their Wix accounts
- Generate temporary passwords for new users (users will need to reset)

### Sync Single User
```bash
POST /api/admin/wix/sync/{wixUserId}
```
Synchronizes a specific user by their Wix user ID.

### Get Wix User Info
```bash
GET /api/admin/wix/user/{wixUserId}
```
Retrieves user information from Wix for a specific user ID.

## Data Mapping

| Wix Field | Replit Field | Notes |
|-----------|--------------|-------|
| `_id` | `wixUserId` | Stored for reference and future syncs |
| `loginEmail` | `email` | Primary identifier |
| `username` | `username` | Generated from email if not provided |
| `firstName` + `lastName` | `fullName` | Combined into single field |
| `phone` | `phoneNumber` | Optional field |
| `status` | `phoneVerified` | Maps APPROVED to true |
| `dateCreated` | `createdAt` | Preserves original creation date |

## Sync Process

1. **Fetch Users**: Retrieves all members from Wix using the Members API
2. **Check Existing**: For each Wix user, checks if they already exist in Replit by email
3. **Create or Link**: 
   - If user doesn't exist: Creates new user with temporary password
   - If user exists but no Wix link: Links existing user to Wix account
   - If already linked: Skips with log message
4. **Error Handling**: Continues processing even if individual users fail, logging all errors

## Security Considerations

- **Temporary Passwords**: New users receive secure temporary passwords and must reset them
- **Existing Users**: Already registered users keep their existing passwords
- **Data Privacy**: Only essential user data is synchronized
- **API Security**: All Wix API calls use secure authentication headers

## Usage Examples

### Manual Sync (One-time)
```bash
curl -X POST http://localhost:5000/api/admin/wix/sync
```

### Test Connection
```bash
curl http://localhost:5000/api/admin/wix/test
```

### Check Single User
```bash
curl http://localhost:5000/api/admin/wix/user/WIXUSER123
```

## Scheduled Sync (Optional)

You can set up automated syncing by calling the sync endpoint periodically:

```javascript
// Example: Sync every 24 hours
setInterval(async () => {
  try {
    const response = await fetch('/api/admin/wix/sync', { method: 'POST' });
    const result = await response.json();
    console.log('Daily Wix sync completed:', result);
  } catch (error) {
    console.error('Daily Wix sync failed:', error);
  }
}, 24 * 60 * 60 * 1000);
```

## Troubleshooting

### Common Issues:

1. **Missing Environment Variables**
   - Error: "Missing Wix API configuration"
   - Solution: Set all required WIX_* environment variables

2. **Invalid API Key**
   - Error: "Wix API error: 401 - Unauthorized"
   - Solution: Verify API key has correct permissions and is not expired

3. **Rate Limiting**
   - Error: "Wix API error: 429 - Too Many Requests"
   - Solution: Implement delays between sync operations or reduce sync frequency

4. **Duplicate Users**
   - Error: "Username already exists"
   - Solution: The system automatically generates unique usernames by appending numbers

### Logs to Check:

- Server console logs for detailed sync progress
- Database logs for user creation/update operations
- Google Sheets sync logs (if enabled)

## Data Flow Diagram

```
Wix Website Users
        ↓
   [Wix Members API]
        ↓
  [Sync Service] → [Validation & Mapping]
        ↓
 [Replit Database] → [Google Sheets] (optional)
        ↓
   [User Dashboard]
```

## Future Enhancements

- **Bidirectional Sync**: Sync changes from Replit back to Wix
- **Real-time Webhooks**: Instant sync when Wix users change
- **Batch Processing**: Handle large user sets more efficiently
- **Conflict Resolution**: Advanced handling of data conflicts
- **Custom Field Mapping**: Configure which fields to sync