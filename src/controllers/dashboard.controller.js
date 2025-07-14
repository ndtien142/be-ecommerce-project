const DashboardService = require('../services/dashboard/dashboard.service');
const { SuccessResponse } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class DashboardController {
    /**
     * Get workflow statistics
     * GET /api/v1/dashboard/workflow/statistics
     */
    async getWorkflowStatistics(req, res, next) {
        try {
            const {
                period = '7days',
                startDate,
                endDate,
                timezone = 'Asia/Ho_Chi_Minh',
            } = req.query;

            // Validate period
            const validPeriods = ['today', '7days', 'month', 'custom'];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError(
                    'Giá trị period phải là: today, 7days, month, hoặc custom',
                );
            }

            // Validate custom period
            if (period === 'custom' && (!startDate || !endDate)) {
                throw new BadRequestError(
                    'startDate và endDate bắt buộc khi period=custom',
                );
            }

            // Validate date format
            if (startDate && !this.isValidDate(startDate)) {
                throw new BadRequestError(
                    'startDate phải có định dạng YYYY-MM-DD',
                );
            }

            if (endDate && !this.isValidDate(endDate)) {
                throw new BadRequestError(
                    'endDate phải có định dạng YYYY-MM-DD',
                );
            }

            const result = await DashboardService.getWorkflowStatistics(
                period,
                startDate,
                endDate,
                timezone,
            );

            return new SuccessResponse({
                message: 'Lấy thống kê workflow thành công',
                metadata: result,
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get dashboard overview
     * GET /api/v1/dashboard/workflow/overview
     */
    async getDashboardOverview(req, res, next) {
        try {
            const {
                period = '7days',
                startDate,
                endDate,
                timezone = 'Asia/Ho_Chi_Minh',
            } = req.query;

            // Validate period
            const validPeriods = ['today', '7days', 'month', 'custom'];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError(
                    'Giá trị period phải là: today, 7days, month, hoặc custom',
                );
            }

            // Validate custom period
            if (period === 'custom' && (!startDate || !endDate)) {
                throw new BadRequestError(
                    'startDate và endDate bắt buộc khi period=custom',
                );
            }

            // Validate date format
            if (startDate && !this.isValidDate(startDate)) {
                throw new BadRequestError(
                    'startDate phải có định dạng YYYY-MM-DD',
                );
            }

            if (endDate && !this.isValidDate(endDate)) {
                throw new BadRequestError(
                    'endDate phải có định dạng YYYY-MM-DD',
                );
            }

            const result = await DashboardService.getDashboardOverview(
                period,
                startDate,
                endDate,
                timezone,
            );

            return new SuccessResponse({
                message: 'Lấy thống kê dashboard thành công',
                metadata: result,
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get time series data
     * GET /api/v1/dashboard/workflow/timeseries
     */
    async getTimeSeriesData(req, res, next) {
        try {
            const {
                period = '7days',
                startDate,
                endDate,
                granularity = 'day',
                metrics = 'orders,revenue,actions',
            } = req.query;

            // Validate period
            const validPeriods = ['today', '7days', 'month', 'custom'];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError(
                    'Giá trị period phải là: today, 7days, month, hoặc custom',
                );
            }

            // Validate granularity
            const validGranularities = ['hour', 'day', 'week'];
            if (!validGranularities.includes(granularity)) {
                throw new BadRequestError(
                    'Giá trị granularity phải là: hour, day, week',
                );
            }

            // Validate metrics
            const validMetrics = [
                'orders',
                'revenue',
                'actions',
                'completionRate',
            ];
            const metricsArray = metrics.split(',').map((m) => m.trim());
            const invalidMetrics = metricsArray.filter(
                (m) => !validMetrics.includes(m),
            );
            if (invalidMetrics.length > 0) {
                throw new BadRequestError(
                    `Metrics không hợp lệ: ${invalidMetrics.join(', ')}`,
                );
            }

            // Validate custom period
            if (period === 'custom' && (!startDate || !endDate)) {
                throw new BadRequestError(
                    'startDate và endDate bắt buộc khi period=custom',
                );
            }

            // Validate date format
            if (startDate && !this.isValidDate(startDate)) {
                throw new BadRequestError(
                    'startDate phải có định dạng YYYY-MM-DD',
                );
            }

            if (endDate && !this.isValidDate(endDate)) {
                throw new BadRequestError(
                    'endDate phải có định dạng YYYY-MM-DD',
                );
            }

            const result = await DashboardService.getTimeSeriesData(
                period,
                startDate,
                endDate,
                granularity,
                metrics,
            );

            return new SuccessResponse({
                message: 'Lấy dữ liệu thời gian thành công',
                metadata: result,
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get real-time metrics
     * GET /api/v1/dashboard/workflow/realtime
     */
    async getRealtimeMetrics(req, res, next) {
        try {
            const result = await DashboardService.getRealtimeMetrics();

            return new SuccessResponse({
                message: 'Lấy thống kê thời gian thực thành công',
                metadata: result,
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Clear dashboard cache
     * DELETE /api/v1/dashboard/workflow/cache
     */
    async clearCache(req, res, next) {
        try {
            DashboardService.clearCache();

            return new SuccessResponse({
                message: 'Xóa cache thành công',
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Validate date format (YYYY-MM-DD)
     */
    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) {
            return false;
        }

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
}

module.exports = new DashboardController();
