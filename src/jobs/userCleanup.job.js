'use strict';

const cron = require('node-cron');
const userRepo = require('../models/repo/user.repo');

/**
 * Job to clean up unverified user accounts after 15 minutes
 * Runs every 5 minutes to check for expired unverified accounts
 */
class UserCleanupJob {
    constructor() {
        this.cronExpression = '*/5 * * * *'; // Run every 5 minutes
        this.job = null;
    }

    /**
     * Start the cleanup job
     */
    start() {
        console.log(
            '🔄 Starting user cleanup job - checking every 5 minutes for unverified accounts older than 5 minutes',
        );

        this.job = cron.schedule(
            this.cronExpression,
            async () => {
                await this.cleanupUnverifiedAccounts();
            },
            {
                scheduled: true,
                timezone: 'Asia/Ho_Chi_Minh',
            },
        );

        // Run immediately on startup
        this.cleanupUnverifiedAccounts();
    }

    /**
     * Stop the cleanup job
     */
    stop() {
        if (this.job) {
            this.job.stop();
            console.log('⏹️ User cleanup job stopped');
        }
    }

    /**
     * Clean up unverified accounts older than 5 minutes
     * - Excludes admin users (they will never be deleted)
     * - Hard deletes users with no orders/cart
     * - Soft deletes users with orders/cart to preserve data integrity
     */
    async cleanupUnverifiedAccounts() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            // Find unverified accounts older than 5 minutes (excluding admins)
            const expiredAccounts =
                await userRepo.findUnverifiedExpiredAccounts(fiveMinutesAgo);

            if (expiredAccounts.length === 0) {
                console.log(
                    '✅ No expired unverified accounts found (admins excluded)',
                );
                return;
            }

            console.log(
                `🧹 Found ${expiredAccounts.length} expired unverified accounts to clean up (admins excluded):`,
            );

            // Log the accounts being deleted
            expiredAccounts.forEach((account) => {
                const timeDiff = Math.floor(
                    (Date.now() - account.create_time.getTime()) / (1000 * 60),
                );
                console.log(
                    `  - ${account.user_login} (${account.user_email}) - ${timeDiff} minutes old`,
                );
            });

            // Delete each account individually with appropriate strategy
            let deletedCount = 0;
            for (const account of expiredAccounts) {
                try {
                    await userRepo.deleteAccountWithRelations(account.id);
                    deletedCount++;
                } catch (error) {
                    console.error(
                        `  ❌ Failed to delete account ${account.user_login}:`,
                        error.message,
                    );
                }
            }

            console.log(
                `🗑️ Successfully processed ${deletedCount} expired unverified accounts`,
            );
        } catch (error) {
            console.error('❌ Error during user cleanup:', error);
        }
    }

    /**
     * Manual cleanup trigger for testing
     */
    async manualCleanup() {
        console.log('🔧 Manual cleanup triggered');
        await this.cleanupUnverifiedAccounts();
    }
}

module.exports = UserCleanupJob;
