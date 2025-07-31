import { generateMonthlyReport } from './emailService';

// Simple scheduler for monthly reports
class ReportScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Report scheduler is already running');
      return;
    }

    console.log('Starting monthly report scheduler...');
    this.isRunning = true;

    // Check every hour if we need to send a monthly report
    this.intervalId = setInterval(async () => {
      await this.checkAndSendMonthlyReport();
    }, 60 * 60 * 1000); // Check every hour

    // Also check immediately on startup
    this.checkAndSendMonthlyReport();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Monthly report scheduler stopped');
  }

  private async checkAndSendMonthlyReport() {
    try {
      const now = new Date();
      const currentDay = now.getDate();
      const currentHour = now.getHours();

      // Send report on the 1st day of each month at 9 AM
      if (currentDay === 1 && currentHour === 9) {
        const lastReportKey = `lastReport_${now.getFullYear()}_${now.getMonth()}`;
        
        // Simple check to avoid sending multiple reports on the same day
        // In production, you'd want to use a database or redis for this
        if (!global.lastReportSent || global.lastReportSent !== lastReportKey) {
          console.log('Generating and sending monthly report...');
          await generateMonthlyReport();
          global.lastReportSent = lastReportKey;
          console.log('Monthly report sent successfully');
        }
      }
    } catch (error) {
      console.error('Error in monthly report scheduler:', error);
    }
  }

  // Manual trigger for testing
  async triggerMonthlyReport() {
    console.log('Manually triggering monthly report...');
    try {
      await generateMonthlyReport();
      console.log('Monthly report sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending manual monthly report:', error);
      return false;
    }
  }
}

// Global scheduler instance
export const reportScheduler = new ReportScheduler();

// Extend global type for TypeScript
declare global {
  var lastReportSent: string | undefined;
}