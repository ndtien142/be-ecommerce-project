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
        console.log('🚀 Đang khởi tạo trình quản lý công việc...');

        // Initialize user cleanup job
        this.jobs.userCleanup = new UserCleanupJob();
        this.jobs.userCleanup.start();

        console.log('✅ Tất cả công việc đã được khởi tạo thành công');
    }

    /**
     * Stop all jobs
     */
    async stop() {
        console.log('⏹️ Đang dừng tất cả công việc...');

        for (const [name, job] of Object.entries(this.jobs)) {
            if (job && typeof job.stop === 'function') {
                job.stop();
                console.log(`⏹️ Đã dừng công việc ${name}`);
            }
        }

        console.log('✅ Đã dừng tất cả công việc');
    }

    /**
     * Get job by name
     */
    getJob(name) {
        return this.jobs[name];
    }
}

module.exports = new JobManager();
