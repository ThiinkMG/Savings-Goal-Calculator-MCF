# Wix Database Connection Setup Guide

This guide shows you how to connect your Wix website to your Replit PostgreSQL database using the custom database adaptor.

## Step 1: Get Your Replit App URL

Your Replit app URL is: `https://your-repl-name.replit.app`

For this app, the Wix database adaptor endpoints are available at:
```
https://your-repl-name.replit.app/api/wix-adaptor/
```

## Step 2: Configure Wix Database Adaptor Secret Key

1. In your Replit Secrets, add a new secret:
   - **Key**: `WIX_ADAPTOR_SECRET`
   - **Value**: Generate a secure random string (example: `wix_mcf_2025_secure_key_847291`)

## Step 3: Set Up Custom Database Adaptor in Wix

### In your Wix Editor:

1. **Go to Wix Editor → Database → Connect External Database**

2. **Step 1: Configure the database adaptor**
   - Click "Set Up Custom Adaptor"

3. **Step 2: Connect the adaptor to your site**
   - **Database connection name**: `Savings_Goal_Calculator_Users`
   - **Endpoint URL**: `https://your-repl-name.replit.app/api/wix-adaptor`
   - **Secret Key**: Your `WIX_ADAPTOR_SECRET` value from Replit Secrets

## Step 4: Available API Endpoints

The Wix database adaptor provides these endpoints:

### User Management
- `GET /api/wix-adaptor/health` - Health check
- `GET /api/wix-adaptor/users` - Get all users (with pagination)
- `GET /api/wix-adaptor/users/:id` - Get user by ID
- `POST /api/wix-adaptor/users` - Create new user
- `PUT /api/wix-adaptor/users/:id` - Update user

### Savings Goals Management
- `GET /api/wix-adaptor/users/:userId/goals` - Get user's savings goals
- `GET /api/wix-adaptor/goals/:id` - Get savings goal by ID
- `POST /api/wix-adaptor/goals` - Create new savings goal
- `PUT /api/wix-adaptor/goals/:id` - Update savings goal
- `DELETE /api/wix-adaptor/goals/:id` - Delete savings goal

## Step 5: Authentication

All requests to the Wix adaptor endpoints require authentication using the Bearer token:

```
Authorization: Bearer YOUR_WIX_ADAPTOR_SECRET
```

## Step 6: Data Schema

### User Schema (Wix Format)
```json
{
  "_id": "string",
  "username": "string",
  "email": "string",
  "fullName": "string",
  "phoneNumber": "string",
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

### Savings Goal Schema (Wix Format)
```json
{
  "_id": "string",
  "userId": "string",
  "name": "string",
  "targetAmount": 1000,
  "currentSavings": 250,
  "targetDate": "2025-12-31",
  "goalType": "college",
  "monthlyCapacity": 100,
  "status": "active",
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

## Step 7: Testing the Connection

You can test the connection using these curl commands:

### Test Health Check
```bash
curl -X GET https://your-repl-name.replit.app/api/wix-adaptor/health
```

### Test Get Users (with authentication)
```bash
curl -X GET https://your-repl-name.replit.app/api/wix-adaptor/users \
  -H "Authorization: Bearer YOUR_WIX_ADAPTOR_SECRET"
```

## Step 8: Wix Integration Features

Once connected, you can:

1. **Display user data** from your Replit app on your Wix website
2. **Create new users** from Wix that sync to your Replit database  
3. **Show savings goals** and progress on your Wix pages
4. **Real-time sync** between Wix and your financial calculator app
5. **Unified user experience** across both platforms

## Troubleshooting

### Common Issues

1. **403 Unauthorized Error**
   - Check that your `WIX_ADAPTOR_SECRET` is set correctly in Replit Secrets
   - Verify you're sending the correct Bearer token

2. **404 Not Found**
   - Ensure your Replit app is running
   - Check the endpoint URL format

3. **500 Internal Server Error**
   - Check the Replit console logs for detailed error messages
   - Verify your database connection is working

### Debug Steps

1. Test the health endpoint first: `/api/wix-adaptor/health`
2. Check Replit console logs for any errors
3. Verify your database has users and savings goals data
4. Test individual endpoints with curl commands

## Security Notes

- Never expose your `WIX_ADAPTOR_SECRET` in client-side code
- The adaptor uses secure authentication for all data operations
- User passwords are properly hashed and never exposed through the API
- All endpoints validate data before processing

## Next Steps

After connecting successfully:
1. Set up your Wix pages to display user data
2. Configure forms to create/update savings goals
3. Implement real-time progress tracking
4. Add user authentication between platforms