/**
 * scheduler-service.js
 * 
 * Service for scheduling periodic tasks such as health checks and cleanup.
 * This service uses node-cron to schedule tasks at regular intervals.
 */

import cron from 'node-cron';
import { HealthMonitorService } from './health-monitor-service.js';
import { getErrorStats } from '../lib/error-handler.js';

/**
 * Setup scheduled tasks
 * 
 * @param {Object} app - Express app instance
 */
export function setupScheduledTasks(app) {
  const pool = app.locals.pool;
  const apiBaseUrl = app.locals.apiBaseUrl;
  
  console.log('Setting up scheduled tasks...');
  
  // Run health checks every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled health checks...');
    
    try {
      const healthMonitor = new HealthMonitorService(pool, apiBaseUrl);
      const results = await healthMonitor.runAllChecks();
      
      console.log(`Scheduled health checks completed: ${results.summary.pass}/${results.summary.total} passing`);
      
      // Check if there are any failures and log them
      if (results.summary.fail > 0) {
        console.warn(`Warning: ${results.summary.fail} endpoints failed health checks`);
        
        // Log each failure
        for (const endpoint of results.endpoints) {
          if (endpoint.status === 'FAIL') {
            console.error(`Failed endpoint: ${endpoint.category} - ${endpoint.endpoint}`, 
              endpoint.error ? { error: endpoint.error } : { statusCode: endpoint.statusCode });
          }
        }
      }
    } catch (error) {
      console.error('Error running scheduled health checks:', error);
    }
  });
  
  // Clean up old health check records (keep last 7 days)
  cron.schedule('0 2 * * *', async () => {
    console.log('Cleaning up old health check records...');
    
    try {
      // Get retention period from settings
      const settingsResult = await pool.query(`
        SELECT value->>'health_checks' as days
        FROM settings
        WHERE category = 'system' AND key = 'retention_period'
      `);
      
      const days = parseInt(settingsResult.rows[0]?.days || '7');
      
      const healthMonitor = new HealthMonitorService(pool, apiBaseUrl);
      const deletedCount = await healthMonitor.cleanupOldRecords(days);
      
      console.log(`Cleaned up ${deletedCount} old health check records (older than ${days} days)`);
    } catch (error) {
      console.error('Error cleaning up old health check records:', error);
    }
  });
  
  // Clean up old error records (keep last 30 days)
  cron.schedule('0 3 * * *', async () => {
    console.log('Cleaning up old error records...');
    
    try {
      // Get retention period from settings
      const settingsResult = await pool.query(`
        SELECT value->>'errors' as days
        FROM settings
        WHERE category = 'system' AND key = 'retention_period'
      `);
      
      const days = parseInt(settingsResult.rows[0]?.days || '30');
      
      const result = await pool.query(`
        DELETE FROM system_errors
        WHERE created_at < NOW() - INTERVAL '${days} days'
        RETURNING id
      `);
      
      console.log(`Cleaned up ${result.rowCount} old error records (older than ${days} days)`);
    } catch (error) {
      console.error('Error cleaning up old error records:', error);
    }
  });
  
  // Generate daily error report
  cron.schedule('0 8 * * *', async () => {
    console.log('Generating daily error report...');
    
    try {
      // Get notification settings
      const settingsResult = await pool.query(`
        SELECT value
        FROM settings
        WHERE category = 'system' AND key = 'notification'
      `);
      
      const notificationSettings = settingsResult.rows[0]?.value || { admin_email: true };
      
      // Get error stats for the last 24 hours
      const errorStats = await getErrorStats(pool, { timeframe: '24h' });
      
      if (errorStats.totalCount > 0) {
        console.log(`Daily error report: ${errorStats.totalCount} errors in the last 24 hours`);
        
        // Log the most common error types
        for (const codeStat of errorStats.codeStats) {
          console.log(`- ${codeStat.code}: ${codeStat.count} occurrences`);
        }
        
        // If admin email notifications are enabled, we would send an email here
        if (notificationSettings.admin_email) {
          console.log('Would send email notification to admin (not implemented)');
          // In a real implementation, we would send an email here
        }
        
        // If Slack notifications are enabled, we would send a Slack message here
        if (notificationSettings.slack) {
          console.log('Would send Slack notification (not implemented)');
          // In a real implementation, we would send a Slack message here
        }
      } else {
        console.log('Daily error report: No errors in the last 24 hours');
      }
    } catch (error) {
      console.error('Error generating daily error report:', error);
    }
  });
  
  console.log('Scheduled tasks setup complete');
}
