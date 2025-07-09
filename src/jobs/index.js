'use strict';

const UserCleanupJob = require('./userCleanup.job');

class JobManager {
    constructor() {
        this.jobs = {};
    }

    /**
     * Initialize and start all jobs
     */
    async init() {
        console.log('🚀 Initializing job manager...');

        // Initialize user cleanup job
        this.jobs.userCleanup = new UserCleanupJob();
        this.jobs.userCleanup.start();

        console.log('✅ All jobs initialized successfully');
    }

    /**
     * Stop all jobs
     */
    async stop() {
        console.log('⏹️ Stopping all jobs...');

        for (const [name, job] of Object.entries(this.jobs)) {
            if (job && typeof job.stop === 'function') {
                job.stop();
                console.log(`⏹️ ${name} job stopped`);
            }
        }

        console.log('✅ All jobs stopped');
    }

    /**
     * Get job by name
     */
    getJob(name) {
        return this.jobs[name];
    }
}

module.exports = new JobManager();
