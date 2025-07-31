import { MailService } from '@sendgrid/mail';
import { db } from './db';
import { users, savingsGoals } from '@shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const ADMIN_EMAILS = [
  'Team@thiinkmediagraphics.com',
  'Contact@mycollegefinance.com'
];

interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendNewSignupAlert(username: string, email?: string): Promise<void> {
  const signupTime = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 New User Signup!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">My College Finance Savings Calculator</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; font-size: 20px;">User Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Username:</td>
            <td style="padding: 8px 0; color: #333;">${username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
            <td style="padding: 8px 0; color: #333;">${email || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Signup Time:</td>
            <td style="padding: 8px 0; color: #333;">${signupTime}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
        <p style="margin: 0; color: #0c5460; font-size: 14px;">
          <strong>Note:</strong> This is an automated notification from the My College Finance Savings Calculator application.
        </p>
      </div>
    </div>
  `;

  const textContent = `
New User Signup - My College Finance

User Details:
- Username: ${username}
- Email: ${email || 'Not provided'}
- Signup Time: ${signupTime}

This is an automated notification from the My College Finance Savings Calculator application.
  `;

  await sendEmail({
    to: ADMIN_EMAILS,
    from: 'noreply@mycollegefinance.com',
    subject: `🎉 New User Signup: ${username}`,
    text: textContent,
    html: htmlContent,
  });
}

export async function generateMonthlyReport(): Promise<void> {
  try {
    // Get all users with their basic info
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
    }).from(users);

    // Get all savings goals with user information
    const allGoals = await db.select({
      goalId: savingsGoals.id,
      goalName: savingsGoals.name,
      goalType: savingsGoals.goalType,
      targetAmount: savingsGoals.targetAmount,
      currentSavings: savingsGoals.currentSavings,
      userId: savingsGoals.userId,
      username: users.username,
      createdAt: savingsGoals.createdAt,
      updatedAt: savingsGoals.updatedAt,
    }).from(savingsGoals)
      .leftJoin(users, eq(savingsGoals.userId, users.id));

    // Generate CSV content for users
    const userCsvHeaders = [
      'User ID',
      'Username', 
      'Encrypted Password Hash',
      'Account Created',
      'Total Goals',
      'Total Target Amount',
      'Total Current Savings'
    ].join(',');

    const userCsvRows = allUsers.map(user => {
      const userGoals = allGoals.filter(goal => goal.userId === user.id);
      const totalTargetAmount = userGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
      const totalCurrentSavings = userGoals.reduce((sum, goal) => sum + (goal.currentSavings || 0), 0);
      
      return [
        user.id,
        `"${user.username}"`,
        `"${user.password.substring(0, 20)}..."`, // Show partial hash for security
        new Date().toISOString().split('T')[0],
        userGoals.length,
        totalTargetAmount.toFixed(2),
        totalCurrentSavings.toFixed(2)
      ].join(',');
    }).join('\n');

    const userCsvContent = `${userCsvHeaders}\n${userCsvRows}`;

    // Generate CSV content for goals
    const goalsCsvHeaders = [
      'Goal ID',
      'Goal Name',
      'Goal Type',
      'Username',
      'Target Amount',
      'Current Savings',
      'Progress %',
      'Created Date',
      'Last Updated'
    ].join(',');

    const goalsCsvRows = allGoals.map(goal => {
      const progress = goal.targetAmount ? ((goal.currentSavings || 0) / goal.targetAmount * 100) : 0;
      
      return [
        goal.goalId,
        `"${goal.goalName || ''}"`,
        `"${goal.goalType || ''}"`,
        `"${goal.username || ''}"`,
        (goal.targetAmount || 0).toFixed(2),
        (goal.currentSavings || 0).toFixed(2),
        progress.toFixed(1),
        goal.createdAt?.toISOString().split('T')[0] || '',
        goal.updatedAt?.toISOString().split('T')[0] || ''
      ].join(',');
    }).join('\n');

    const goalsCsvContent = `${goalsCsvHeaders}\n${goalsCsvRows}`;

    // Create report date
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📊 Monthly Progress Report</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${reportDate}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">My College Finance Savings Calculator</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #27ae60; font-size: 24px;">${allUsers.length}</h3>
            <p style="margin: 0; color: #2c3e50; font-weight: bold;">Total Users</p>
          </div>
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #3498db; font-size: 24px;">${allGoals.length}</h3>
            <p style="margin: 0; color: #2c3e50; font-weight: bold;">Total Goals</p>
          </div>
          <div style="background: #fef9e7; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #f39c12; font-size: 24px;">$${allGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0).toLocaleString()}</h3>
            <p style="margin: 0; color: #2c3e50; font-weight: bold;">Total Target Amount</p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">📎 Attached Reports</h2>
          <ul style="color: #555; margin: 10px 0;">
            <li><strong>user_data.csv</strong> - Complete user information including usernames and encrypted password hashes</li>
            <li><strong>savings_goals.csv</strong> - All savings goals with progress tracking and user association</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Privacy Note:</strong> Password hashes are encrypted and truncated for security. This report contains sensitive user data and should be handled according to your privacy policies.
          </p>
        </div>
      </div>
    `;

    const textContent = `
Monthly Progress Report - ${reportDate}
My College Finance Savings Calculator

Summary:
- Total Users: ${allUsers.length}
- Total Goals: ${allGoals.length}
- Total Target Amount: $${allGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0).toLocaleString()}

Attached Files:
- user_data.csv: Complete user information
- savings_goals.csv: All savings goals with progress tracking

Privacy Note: This report contains sensitive user data and should be handled according to your privacy policies.
    `;

    // Send email with CSV attachments
    await sendEmail({
      to: ADMIN_EMAILS,
      from: 'noreply@mycollegefinance.com',
      subject: `📊 Monthly Report - ${reportDate} - My College Finance`,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          content: Buffer.from(userCsvContent).toString('base64'),
          filename: `user_data_${new Date().getFullYear()}_${(new Date().getMonth() + 1).toString().padStart(2, '0')}.csv`,
          type: 'text/csv',
          disposition: 'attachment',
        },
        {
          content: Buffer.from(goalsCsvContent).toString('base64'),
          filename: `savings_goals_${new Date().getFullYear()}_${(new Date().getMonth() + 1).toString().padStart(2, '0')}.csv`,
          type: 'text/csv',
          disposition: 'attachment',
        },
      ],
    });

    console.log(`Monthly report sent successfully to ${ADMIN_EMAILS.join(', ')}`);
  } catch (error) {
    console.error('Error generating monthly report:', error);
  }
}