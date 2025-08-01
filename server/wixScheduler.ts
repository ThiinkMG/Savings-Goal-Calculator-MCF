import { wixSyncService } from './wixSync';
import cron from 'node-cron';

interface SchedulerConfig {
  enabled: boolean;
  cronSchedule: string; // e.g., '0 2 * * *' for daily at 2 AM
  timezone?: string;
}

class WixSyncScheduler {
  private config: SchedulerConfig;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.config = {
      enabled: process.env.WIX_SYNC_ENABLED === 'true',
      cronSchedule: process.env.WIX_SYNC_SCHEDULE || '0 2 * * *', // Default: daily at 2 AM
      timezone: process.env.WIX_SYNC_TIMEZONE || 'America/New_York'
    };
  }

  public start(): void {
    if (!this.config.enabled) {
      console.log('Wix sync scheduler is disabled. Set WIX_SYNC_ENABLED=true to enable.');
      return;
    }

    if (this.task) {
      console.log('Wix sync scheduler is already running.');
      return;
    }

    console.log(`Starting Wix sync scheduler with schedule: ${this.config.cronSchedule}`);
    
    this.task = cron.schedule(this.config.cronSchedule, async () => {
      if (this.isRunning) {
        console.log('Wix sync is already running, skipping this scheduled run.');
        return;
      }

      await this.runSync();
    }, {
      scheduled: true,
      timezone: this.config.timezone
    });

    console.log(`Wix sync scheduler started. Next run: ${this.getNextRunTime()}`);
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Wix sync scheduler stopped.');
    }
  }

  public async runSync(): Promise<void> {
    if (this.isRunning) {
      console.log('Wix sync is already in progress.');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log(`Starting scheduled Wix sync at ${startTime.toISOString()}`);
      
      const result = await wixSyncService.syncAllUsers();
      
      this.lastRun = new Date();
      const duration = this.lastRun.getTime() - startTime.getTime();
      
      console.log(`Scheduled Wix sync completed in ${duration}ms:`, {
        processed: result.processed,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length,
        success: result.success
      });

      // Log errors if any
      if (result.errors.length > 0) {
        console.error('Wix sync errors:', result.errors);
      }

    } catch (error) {
      console.error('Scheduled Wix sync failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  public getStatus(): {
    enabled: boolean;
    running: boolean;
    schedule: string;
    lastRun: Date | null;
    nextRun: string | null;
  } {
    return {
      enabled: this.config.enabled,
      running: this.isRunning,
      schedule: this.config.cronSchedule,
      lastRun: this.lastRun,
      nextRun: this.getNextRunTime()
    };
  }

  private getNextRunTime(): string | null {
    if (!this.task) return null;
    
    try {
      // Get next execution time from cron task
      const nextExecutions = cron.getTasks();
      return 'Check cron schedule'; // Simplified for now
    } catch (error) {
      return null;
    }
  }

  public updateSchedule(newSchedule: string, timezone?: string): boolean {
    try {
      // Validate cron expression
      if (!cron.validate(newSchedule)) {
        throw new Error('Invalid cron expression');
      }

      // Stop current task
      this.stop();

      // Update config
      this.config.cronSchedule = newSchedule;
      if (timezone) {
        this.config.timezone = timezone;
      }

      // Restart with new schedule
      if (this.config.enabled) {
        this.start();
      }

      console.log(`Wix sync schedule updated to: ${newSchedule}`);
      return true;
    } catch (error) {
      console.error('Failed to update Wix sync schedule:', error);
      return false;
    }
  }

  public enable(): void {
    this.config.enabled = true;
    this.start();
  }

  public disable(): void {
    this.config.enabled = false;
    this.stop();
  }
}

// Create singleton instance
export const wixSyncScheduler = new WixSyncScheduler();

// Auto-start scheduler when module is loaded
if (process.env.WIX_SYNC_ENABLED === 'true') {
  setTimeout(() => {
    wixSyncScheduler.start();
  }, 5000); // Start after 5 seconds to allow server to fully initialize
}