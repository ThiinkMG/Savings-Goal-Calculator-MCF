# Google Sheets Setup Guide - My College Finance

## Step 1: Get Your Google Sheet ID

Your Google Sheet URL looks like this:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit#gid=0
```

Copy the `SPREADSHEET_ID_HERE` part from your URL.

## Step 2: Share Your Sheet with the Service Account

1. Open your Google Sheet
2. Click "Share" in the top right
3. Add this email address: `YOUR_SERVICE_ACCOUNT_EMAIL`
4. Give it "Editor" permissions
5. Click "Send"

## Step 3: Set Up Your Sheet Structure

Your sheet needs these tabs (exactly as named):
- **Users** (for user data)
- **Savings Goals** (for savings goal data)

Or let the system create them automatically.

## Step 4: Connect Your Sheet to the Database

### Option A: Use Admin API (Recommended)
```bash
# Set your specific sheet as the target for live updates
curl -X POST http://localhost:5000/api/admin/set-target-spreadsheet \
  -H "Content-Type: application/json" \
  -d '{"spreadsheetId": "YOUR_SPREADSHEET_ID_HERE"}'
```

This will:
✅ Set your sheet as the automatic sync target
✅ Create the proper headers
✅ Populate with current data
✅ Enable live updates on all future changes

### Option B: Manual Sync
```bash
# One-time sync to your specific sheet
curl -X POST http://localhost:5000/api/admin/sync-google-sheets \
  -H "Content-Type: application/json" \
  -d '{"spreadsheetId": "YOUR_SPREADSHEET_ID_HERE"}'
```

## Step 5: Verify the Connection

### Check Current Target:
```bash
curl -X GET http://localhost:5000/api/admin/target-spreadsheet
```

### Test Live Updates:
1. Register a new user in the app
2. Create a savings goal
3. Check your Google Sheet - it should update automatically!

## What You'll See in Your Sheet

### Users Tab:
- User ID
- Username  
- Created Date
- Total Goals
- Total Target Amount
- Total Current Savings
- Overall Progress %
- Last Updated

### Savings Goals Tab:
- Goal ID
- User ID
- Username
- Goal Name
- Goal Type
- Target Amount
- Current Savings
- Progress %
- Target Date
- Monthly Required
- Is Feasible
- Created Date
- Last Updated

## Troubleshooting

**Sheet not updating?**
- Verify the service account email is shared with your sheet
- Check that the spreadsheet ID is correct
- Ensure the sheet has "Users" and "Savings Goals" tabs

**Permission errors?**
- The service account needs Editor access to your sheet
- Double-check the email address in the share settings

**Data not appearing?**
- Run the sync command manually first
- Check server logs for any error messages
- Verify your Google API credentials are properly set

## Example Usage

```bash
# Complete setup for spreadsheet ID: 1abc123def456ghi789
curl -X POST http://localhost:5000/api/admin/set-target-spreadsheet \
  -H "Content-Type: application/json" \
  -d '{"spreadsheetId": "1abc123def456ghi789"}'

# Response:
{
  "success": true,
  "message": "Target spreadsheet set and initialized successfully",
  "spreadsheetId": "1abc123def456ghi789",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1abc123def456ghi789/edit"
}
```

Now every user registration and goal change will automatically update your Google Sheet in real-time!