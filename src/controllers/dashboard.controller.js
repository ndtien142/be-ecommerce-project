const DashboardService = require('../services/dashboard/dashboard.service');
const { SuccessResponse } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class DashboardController {
    constructor() {
        // Bind methods to preserve 'this' context
        this.clearCache = this.clearCache.bind(this);
        this.getWorkflowStatistics = this.getWorkflowStatistics.bind(this);
        this.getDashboardOverview = this.getDashboardOverview.bind(this);
        this.getTimeSeriesData = this.getTimeSeriesData.bind(this);
        this.getRealtimeMetrics = this.getRealtimeMetrics.bind(this);
        this.getRecentOrders = this.getRecentOrders.bind(this);
        this.isValidDate = this.isValidDate.bind(this);
    }

    /**
     * Clear cache
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

            // Update: Accept more period types
            const validPeriods = [
                'today',
                '7days',
                'month',
                'year',
                'quarter',
                'week',
                'custom',
            ];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError(
                    'Giá trị period phải là: today, 7days, week, month, quarter, year, hoặc custom',
                );
            }

            if (period === 'custom' && (!startDate || !endDate)) {
                throw new BadRequestError(
                    'startDate và endDate bắt buộc khi period=custom',
                );
            }

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

            const validPeriods = [
                'today',
                '7days',
                'month',
                'year',
                'quarter',
                'week',
                'custom',
            ];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError(
                    'Giá trị period phải là: today, 7days, week, month, quarter, year, hoặc custom',
                );
            }

            if (period === 'custom' && (!startDate || !endDate)) {
                throw new BadRequestError(
                    'startDate và endDate bắt buộc khi period=custom',
                );
            }

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
     * Get time series data for charting
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

            const validPeriods = [
                'today',
                '7days',
                'month',
                'year',
                'quarter',
                'week',
                'custom',
            ];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError(
                    'Giá trị period phải là: today, 7days, week, month, quarter, year, hoặc custom',
                );
            }

            // Accept more granularities
            const validGranularities = [
                'hour',
                'day',
                'week',
                'month',
                'quarter',
                'year',
            ];
            if (!validGranularities.includes(granularity)) {
                throw new BadRequestError(
                    'Giá trị granularity phải là: hour, day, week, month, quarter, year',
                );
            }

            const validMetrics = [
                'orders',
                'revenue',
                'actions',
                'completionRate',
                'momoSuccess',
                'cashSuccess',
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

            if (period === 'custom' && (!startDate || !endDate)) {
                throw new BadRequestError(
                    'startDate và endDate bắt buộc khi period=custom',
                );
            }

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
                message: 'Lấy dữ liệu chuỗi thời gian thành công',
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
     * Get recent orders with pagination
     * GET /api/v1/dashboard/recent-orders
     */
    async getRecentOrders(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                userId,
                startDate,
                endDate,
            } = req.query;

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);

            if (pageNum < 1) {
                throw new BadRequestError('Page phải lớn hơn 0');
            }

            if (limitNum < 1 || limitNum > 100) {
                throw new BadRequestError('Limit phải từ 1 đến 100');
            }

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

            const filters = {
                status,
                userId: userId ? parseInt(userId) : undefined,
                startDate,
                endDate,
            };

            const result = await DashboardService.getRecentOrders(
                pageNum,
                limitNum,
                filters,
            );

            return new SuccessResponse({
                message: 'Lấy danh sách đơn hàng mới nhất thành công',
                metadata: {
                    orders: result.orders,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limitNum),
                        hasNext: pageNum < Math.ceil(result.total / limitNum),
                        hasPrev: pageNum > 1,
                    },
                },
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

const dashboardController = new DashboardController();
module.exports = dashboardController;
