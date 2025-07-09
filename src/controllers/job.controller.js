'use strict';

const { SuccessResponse } = require('../core/success.response');
const jobManager = require('../jobs');

class JobController {
    /**
     * Manual trigger for user cleanup job
     */
    manualUserCleanup = async (req, res, next) => {
        try {
            const userCleanupJob = jobManager.getJob('userCleanup');

            if (!userCleanupJob) {
                return new SuccessResponse({
                    message: 'User cleanup job not found',
                    metadata: { success: false },
                }).send(res);
            }

            await userCleanupJob.manualCleanup();

            return new SuccessResponse({
                message: 'User cleanup job triggered successfully',
                metadata: { success: true },
            }).send(res);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get job status
     */
    getJobStatus = async (req, res, next) => {
        try {
            const userCleanupJob = jobManager.getJob('userCleanup');

            const status = {
                userCleanup: {
                    active: userCleanupJob ? true : false,
                    cronExpression: userCleanupJob
                        ? userCleanupJob.cronExpression
                        : null,
                    timezone: 'Asia/Ho_Chi_Minh',
                },
            };

            return new SuccessResponse({
                message: 'Job status retrieved successfully',
                metadata: status,
            }).send(res);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new JobController();
