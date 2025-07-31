# Integration Testing Guide - My College Finance

## How to Test All Features

### 1. Email Notifications Testing

#### Test New User Signup Emails:
```bash
# Create a new user (triggers signup email)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser1", "password": "testpass123"}'
```
**Expected Result:** Email sent to Team@thiinkmediagraphics.com and Contact@mycollegefinance.com

#### Test Monthly Report:
```bash
# Manually trigger monthly report
curl -X POST http://localhost:5000/api/admin/test-monthly-report \
  -H "Content-Type: application/json"
```
**Expected Result:** Email with CSV attachments sent to admin emails

### 2. Google Sheets Integration Testing

#### Create a New Google Spreadsheet:
```bash
# Create a new spreadsheet for live data
curl -X POST http://localhost:5000/api/admin/create-google-sheet \
  -H "Content-Type: application/json" \
  -d '{"title": "My College Finance - Live Test Data"}'
```
**Expected Result:** Returns spreadsheet ID and URL

#### Sync All Data to Google Sheets:
```bash
# Sync current database to Google Sheets (use spreadsheet ID from above)
curl -X POST http://localhost:5000/api/admin/sync-google-sheets \
  -H "Content-Type: application/json" \
  -d '{"spreadsheetId": "YOUR_SPREADSHEET_ID_HERE"}'
```
**Expected Result:** All users and goals appear in the spreadsheet

### 3. End-to-End Testing Workflow

#### Step 1: Create Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "securepass456"}'
```

#### Step 2: Login as Test User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "securepass456"}' \
  -c cookies.txt
```

#### Step 3: Create a Savings Goal
```bash
curl -X POST http://localhost:5000/api/savings-goals \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Emergency Fund",
    "goalType": "emergency",
    "targetAmount": 5000,
    "currentSavings": 1200,
    "targetDate": "2025-12-31",
    "monthlyCapacity": 300
  }'
```

#### Step 4: Update the Goal
```bash
curl -X PATCH http://localhost:5000/api/savings-goals/GOAL_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"currentSavings": 1500}'
```

## What to Check After Each Test

### Email Verification:
1. **Check Admin Inboxes:** Look for emails at Team@thiinkmediagraphics.com and Contact@mycollegefinance.com
2. **Signup Alerts:** Should include username, signup time, and professional formatting
3. **Monthly Reports:** Should include CSV files with user data and savings goals

### Google Sheets Verification:
1. **Open the Spreadsheet:** Use the URL returned from create-google-sheet
2. **Check Users Sheet:** Should show user ID, username, total goals, amounts, progress
3. **Check Savings Goals Sheet:** Should show detailed goal information with calculations
4. **Verify Real-time Updates:** Data should update automatically when you modify goals

### Database Verification:
```bash
# Check if user was created
curl -X GET http://localhost:5000/api/auth/me -b cookies.txt

# Check user's goals
curl -X GET http://localhost:5000/api/savings-goals -b cookies.txt
```

## Troubleshooting

### If Emails Don't Send:
- Check server logs for SendGrid errors
- Verify SENDGRID_API_KEY is set correctly
- Confirm SendGrid account is active

### If Google Sheets Don't Update:
- Check server logs for Google API errors
- Verify all Google credentials are set (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)
- Ensure the service account has proper permissions

### If Database Operations Fail:
- Check PostgreSQL connection
- Verify DATABASE_URL is correct
- Check for migration issues

## Success Indicators

✅ **Email System Working:**
- Signup emails arrive in admin inboxes
- Monthly reports include CSV attachments
- Professional HTML formatting

✅ **Google Sheets Working:**
- Spreadsheet created successfully
- Data syncs automatically on user actions
- Real-time updates visible in sheets

✅ **Authentication Working:**
- Users can register and login
- Session persistence works
- Guest mode functions properly

✅ **Database Working:**
- Goals save and retrieve correctly
- User data isolation works
- Updates persist across sessions