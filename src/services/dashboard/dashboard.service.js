const dashboardRepo = require('../../repositories/dashboard.repo');
const dashboardSchema = require('../../schema/dashboard.schema');

class DashboardService {
    static CACHE_TTL = 5 * 60 * 1000;
    static cache = new Map();
    static statusDisplayNames = {
        pending_confirmation: { name: 'Chờ xác nhận', color: '#ff9800' },
        pending_pickup: { name: 'Chờ lấy hàng', color: '#2196f3' },
        shipping: { name: 'Đang giao hàng', color: '#ff5722' },
        delivered: { name: 'Đã giao hàng', color: '#4caf50' },
        customer_confirmed: { name: 'Đã xác nhận', color: '#8bc34a' },
        returned: { name: 'Đã trả hàng', color: '#9c27b0' },
        cancelled: { name: 'Đã hủy', color: '#f44336' },
    };
    static methodDisplayNames = {
        momo: 'MoMo',
        cod: 'Thanh toán khi nhận hàng',
        cash: 'Tiền mặt',
    };

    static getPeriodDates(
        period,
        startDate,
        endDate,
        timezone = 'Asia/Ho_Chi_Minh',
    ) {
        const now = new Date();
        let start, end;
        switch (period) {
            case 'today':
                start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                end = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    23,
                    59,
                    59,
                );
                break;
            case '7days':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                end = now;
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                );
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;
            case 'quarter': {
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(
                    now.getFullYear(),
                    quarter * 3 + 3,
                    0,
                    23,
                    59,
                    59,
                );
                break;
            }
            case 'week': {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            }
            case 'custom':
                if (!startDate || !endDate)
                    throw new Error(
                        'startDate and endDate are required for custom period',
                    );
                start = new Date(startDate);
                end = new Date(endDate);
                break;
            default:
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                end = now;
                period = '7days';
        }
        return {
            type: period,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            timezone,
            startDateTime: start,
            endDateTime: end,
        };
    }

    static async getOrdersByStatus(periodInfo) {
        const stats = await dashboardRepo.findOrdersByStatus(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
        const totalOrders = stats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );
        return stats.map((stat) => {
            const display =
                DashboardService.statusDisplayNames[stat.status] || {};
            return dashboardSchema.orderStatus(
                stat,
                display.name || stat.status,
                display.color || '#9e9e9e',
                totalOrders,
            );
        });
    }

    static async getPaymentsByStatusAndMethod(periodInfo) {
        const stats = await dashboardRepo.findPaymentsByStatusAndMethod(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
        const totalPayments = stats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );
        return stats.map((stat) =>
            dashboardSchema.paymentStatus(
                stat,
                DashboardService.methodDisplayNames[stat.payment_method] ||
                    stat.payment_method,
                totalPayments,
            ),
        );
    }

    static async getTotalOrders(periodInfo) {
        return dashboardRepo.countOrders(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
    }

    static async getTotalActions(periodInfo) {
        return dashboardRepo.countOrderLogs(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
    }

    static async getActionStats(periodInfo) {
        const actionDisplayNames = {
            created: 'Tạo đơn hàng',
            confirmed: 'Xác nhận đơn hàng',
            picked_up: 'Lấy hàng',
            delivered: 'Giao hàng thành công',
            customer_confirmed: 'Khách hàng xác nhận',
            returned: 'Trả hàng',
            cancelled: 'Hủy đơn hàng',
            payment_completed: 'Thanh toán hoàn tất',
            cod_completed: 'Hoàn tất COD',
            refunded: 'Hoàn tiền',
        };

        const actionStats = await dashboardRepo.findOrderLogsByAction(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
        const totalActions = actionStats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );

        // Lấy dữ liệu kỳ trước
        const periodLength =
            periodInfo.endDateTime.getTime() -
            periodInfo.startDateTime.getTime();
        const previousStart = new Date(
            periodInfo.startDateTime.getTime() - periodLength,
        );
        const previousEnd = periodInfo.startDateTime;
        const previousStats = await dashboardRepo.findOrderLogsByAction(
            previousStart,
            previousEnd,
        );
        const previousStatsMap = previousStats.reduce((map, stat) => {
            map[stat.action] = parseInt(stat.count);
            return map;
        }, {});

        return actionStats.map((stat) => {
            const currentCount = parseInt(stat.count);
            const previousCount = previousStatsMap[stat.action] || 0;
            const trendValue =
                previousCount > 0
                    ? (
                          ((currentCount - previousCount) / previousCount) *
                          100
                      ).toFixed(1)
                    : 0;
            let trend = 'stable';
            if (trendValue > 5) trend = 'up';
            else if (trendValue < -5) trend = 'down';
            return {
                action: stat.action,
                displayName: actionDisplayNames[stat.action] || stat.action,
                count: currentCount,
                percentage:
                    totalActions > 0
                        ? ((currentCount / totalActions) * 100).toFixed(1)
                        : 0,
                trend,
                trendValue: parseFloat(trendValue),
            };
        });
    }

    static async getActorStats(periodInfo) {
        const actorDisplayNames = {
            system: 'Hệ thống',
            admin: 'Quản trị viên',
            customer: 'Khách hàng',
            shipper: 'Người giao hàng',
            payment_gateway: 'Cổng thanh toán',
        };

        const actorStats = await dashboardRepo.findOrderLogsByActor(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
        const totalActions = actorStats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );

        const actorStatsWithActive = await Promise.all(
            actorStats.map(async (stat) => {
                let activeCount = null;
                if (stat.actor_type === 'admin') {
                    activeCount = await dashboardRepo.countActiveAdmins();
                } else if (stat.actor_type === 'customer') {
                    activeCount = await dashboardRepo.countActiveCustomers();
                }
                return {
                    actorType: stat.actor_type,
                    displayName:
                        actorDisplayNames[stat.actor_type] || stat.actor_type,
                    count: parseInt(stat.count),
                    percentage:
                        totalActions > 0
                            ? (
                                  (parseInt(stat.count) / totalActions) *
                                  100
                              ).toFixed(1)
                            : 0,
                    averageResponseTime:
                        parseFloat(stat.averageResponseTime) || 0,
                    activeCount,
                };
            }),
        );
        return actorStatsWithActive;
    }

    static async calculateCompletionRate(periodInfo) {
        const [totalOrders, completedOrders] = await Promise.all([
            dashboardRepo.countOrders(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
            ),
            dashboardRepo.countCompletedOrders(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
            ),
        ]);
        return totalOrders > 0
            ? ((completedOrders / totalOrders) * 100).toFixed(1)
            : 0;
    }

    static async getAverageProcessingTime(periodInfo) {
        const result = await dashboardRepo.getAverageProcessingTime(
            periodInfo.startDateTime,
            periodInfo.endDateTime,
        );
        return parseFloat(result[0]?.averageTime) || 0;
    }

    static async getPendingAlerts() {
        const [
            pendingConfirmation,
            pendingPickup,
            overdueOrders,
            paymentIssues,
        ] = await Promise.all([
            dashboardRepo.countPendingConfirmation(),
            dashboardRepo.countPendingPickup(),
            dashboardRepo.countOverdueOrders(),
            dashboardRepo.countPaymentIssues(),
        ]);
        return {
            pendingConfirmation,
            pendingPickup,
            overdueOrders,
            paymentIssues,
        };
    }

    static async getRecentActivities() {
        const recentLogs = await dashboardRepo.findRecentOrderLogs();
        return recentLogs.map((log) => ({
            id: log.id,
            orderId: log.order_id,
            action: log.action,
            actorType: log.actor_type,
            actorName: log.actor_name,
            timestamp: log.created_at.toISOString(),
            description: this.getActionDescription(log.action, log.actor_name),
        }));
    }

    static getActionDescription(action, actorName) {
        const descriptions = {
            created: 'Tạo đơn hàng mới',
            confirmed: 'Xác nhận đơn hàng',
            picked_up: 'Đã lấy hàng, chuẩn bị giao',
            delivered: 'Đã giao hàng thành công',
            customer_confirmed: 'Khách hàng xác nhận đã nhận hàng',
            returned: 'Trả hàng',
            cancelled: 'Hủy đơn hàng',
            payment_completed: 'Thanh toán hoàn tất',
            cod_completed: 'Hoàn tất thanh toán COD',
            refunded: 'Hoàn tiền',
        };
        const baseDescription = descriptions[action] || action;
        return actorName ? `${baseDescription}` : baseDescription;
    }

    static async getRealtimeMetrics() {
        const [activeOrders, totalUsers, pendingActions, recentActivities] =
            await Promise.all([
                dashboardRepo.findOrdersByStatus([
                    'pending_confirmation',
                    'pending_pickup',
                    'shipping',
                ]),
                dashboardRepo.countActiveCustomers(),
                dashboardRepo.countOrderLogs(
                    new Date(Date.now() - 60 * 60 * 1000),
                    new Date(),
                ),
                this.getRecentActivities(),
            ]);
        const activeOrdersCount = activeOrders.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );
        return {
            timestamp: new Date().toISOString(),
            activeOrders: activeOrdersCount,
            totalUsers,
            pendingActions,
            systemHealth: {
                status: 'healthy',
                responseTime: 156, // giả lập
                uptime: 99.98,
            },
            recentActivities,
        };
    }

    static async getDashboardOverview(period, startDate, endDate, timezone) {
        const cacheKey = `dashboard-overview-${period}-${startDate}-${endDate}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.data;
            }
        }
        const periodInfo = this.getPeriodDates(
            period,
            startDate,
            endDate,
            timezone,
        );
        const [
            totalOrders,
            totalActions,
            actionStats,
            actorStats,
            pendingAlerts,
        ] = await Promise.all([
            DashboardService.getTotalOrders(periodInfo),
            DashboardService.getTotalActions(periodInfo),
            DashboardService.getActionStats(periodInfo),
            DashboardService.getActorStats(periodInfo),
            DashboardService.getPendingAlerts(),
        ]);
        const completionRate =
            await DashboardService.calculateCompletionRate(periodInfo);
        const averageProcessingTime =
            await DashboardService.getAverageProcessingTime(periodInfo);
        const result = {
            period: periodInfo,
            totalOrders,
            totalActions,
            completionRate,
            averageProcessingTime,
            pendingAlerts,
            actionStats,
            actorStats,
        };
        DashboardService.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
        });
        return result;
    }

    static async getWorkflowStatistics(period, startDate, endDate, timezone) {
        const cacheKey = `workflow-stats-${period}-${startDate}-${endDate}`;
        if (DashboardService.cache.has(cacheKey)) {
            const cached = DashboardService.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < DashboardService.CACHE_TTL) {
                return cached.data;
            }
        }
        const periodInfo = DashboardService.getPeriodDates(
            period,
            startDate,
            endDate,
            timezone,
        );

        // Get previous period for comparison
        const previousPeriodInfo = DashboardService.getPreviousPeriod(
            periodInfo,
            period,
        );

        const [
            ordersByStatus,
            paymentsByStatusAndMethod,
            previousOrdersByStatus,
        ] = await Promise.all([
            DashboardService.getOrdersByStatus(periodInfo),
            DashboardService.getPaymentsByStatusAndMethod(periodInfo),
            DashboardService.getOrdersByStatus(previousPeriodInfo),
        ]);

        // Calculate trends
        const trends = DashboardService.calculateTrends(
            ordersByStatus,
            previousOrdersByStatus,
        );

        const result = {
            period: periodInfo,
            ordersByStatus,
            paymentsByStatusAndMethod,
            trends,
        };
        DashboardService.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
        });
        return result;
    }

    // Biểu đồ thống kê động cho FE: theo ngày/tuần/tháng/quý/năm
    static async getTimeSeriesData(
        period,
        startDate,
        endDate,
        granularity = 'day',
        metrics = 'orders,revenue,actions',
    ) {
        // metrics: 'orders,revenue,actions'
        const periodInfo = this.getPeriodDates(period, startDate, endDate);
        const metricsArray = metrics.split(',').map((m) => m.trim());
        const result = {};

        if (metricsArray.includes('orders')) {
            const orderStats = await dashboardRepo.groupOrderStats(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
                granularity,
            );
            result.orders = orderStats.map((row) => ({
                period: row.period,
                value: parseInt(row.orders),
            }));
        }

        if (metricsArray.includes('revenue')) {
            const revenueStats = await dashboardRepo.groupRevenueStats(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
                granularity,
            );
            result.revenue = revenueStats.map((row) => ({
                period: row.period,
                value: parseFloat(row.revenue) || 0,
            }));
        }

        if (metricsArray.includes('actions')) {
            const actionStats = await dashboardRepo.groupActionStats(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
                granularity,
            );
            result.actions = actionStats.map((row) => ({
                period: row.period,
                value: parseInt(row.actions),
            }));
        }

        if (metricsArray.includes('momoSuccess')) {
            const momoStats = await dashboardRepo.groupMoMoSuccessStats(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
                granularity,
            );
            result.momoSuccess = momoStats.map((row) => ({
                period: row.period,
                value: parseInt(row.momoOrders),
            }));
        }

        if (metricsArray.includes('cashSuccess')) {
            const cashStats = await dashboardRepo.groupCashSuccessStats(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
                granularity,
            );
            result.cashSuccess = cashStats.map((row) => ({
                period: row.period,
                value: parseInt(row.cashOrders),
            }));
        }

        // Transform data into timeSeries format
        const allPeriods = new Set();
        Object.values(result).forEach((metricData) => {
            metricData.forEach((item) => allPeriods.add(item.period));
        });

        const timeSeries = Array.from(allPeriods)
            .sort()
            .map((period) => {
                const dataPoint = { date: period };

                if (result.orders) {
                    const orderData = result.orders.find(
                        (item) => item.period === period,
                    );
                    dataPoint.orders = orderData ? orderData.value : 0;
                }

                if (result.revenue) {
                    const revenueData = result.revenue.find(
                        (item) => item.period === period,
                    );
                    dataPoint.revenue = revenueData ? revenueData.value : 0;
                }

                if (result.actions) {
                    const actionData = result.actions.find(
                        (item) => item.period === period,
                    );
                    dataPoint.actions = actionData ? actionData.value : 0;
                }

                if (result.momoSuccess) {
                    const momoData = result.momoSuccess.find(
                        (item) => item.period === period,
                    );
                    dataPoint.momoSuccess = momoData ? momoData.value : 0;
                }

                if (result.cashSuccess) {
                    const cashData = result.cashSuccess.find(
                        (item) => item.period === period,
                    );
                    dataPoint.cashSuccess = cashData ? cashData.value : 0;
                }

                return dataPoint;
            });

        return {
            period: periodInfo,
            granularity,
            timeSeries,
        };
    }

    static async getRecentOrders(page = 1, limit = 10, filters = {}) {
        const result = await dashboardRepo.findRecentOrders(
            page,
            limit,
            filters,
        );

        return {
            orders: result.rows,
            total: result.count,
            page,
            limit,
        };
    }

    static getPreviousPeriod(periodInfo, period) {
        const { startDateTime, endDateTime } = periodInfo;
        const duration = endDateTime.getTime() - startDateTime.getTime();

        return {
            startDateTime: new Date(startDateTime.getTime() - duration),
            endDateTime: new Date(endDateTime.getTime() - duration),
        };
    }

    static calculateTrends(current, previous) {
        const calculatePercentageChange = (currentValue, previousValue) => {
            if (previousValue === 0) return currentValue > 0 ? 100 : 0;
            return ((currentValue - previousValue) / previousValue) * 100;
        };

        // Calculate totals
        const currentTotal = current.reduce((sum, item) => sum + item.count, 0);
        const previousTotal = previous.reduce(
            (sum, item) => sum + item.count,
            0,
        );

        // Calculate new orders (pending_confirmation + pending_payment)
        const currentNew = current
            .filter((item) =>
                ['pending_confirmation', 'pending_payment'].includes(
                    item.status,
                ),
            )
            .reduce((sum, item) => sum + item.count, 0);
        const previousNew = previous
            .filter((item) =>
                ['pending_confirmation', 'pending_payment'].includes(
                    item.status,
                ),
            )
            .reduce((sum, item) => sum + item.count, 0);

        // Calculate processing orders
        const currentProcessing = current
            .filter((item) =>
                ['pending_confirmation', 'pending_pickup', 'shipping'].includes(
                    item.status,
                ),
            )
            .reduce((sum, item) => sum + item.count, 0);
        const previousProcessing = previous
            .filter((item) =>
                ['pending_confirmation', 'pending_pickup', 'shipping'].includes(
                    item.status,
                ),
            )
            .reduce((sum, item) => sum + item.count, 0);

        // Calculate completed orders
        const currentCompleted = current
            .filter((item) =>
                ['delivered', 'customer_confirmed'].includes(item.status),
            )
            .reduce((sum, item) => sum + item.count, 0);
        const previousCompleted = previous
            .filter((item) =>
                ['delivered', 'customer_confirmed'].includes(item.status),
            )
            .reduce((sum, item) => sum + item.count, 0);

        return {
            totalOrders: {
                percentage: calculatePercentageChange(
                    currentTotal,
                    previousTotal,
                ),
                isIncrease: currentTotal >= previousTotal,
            },
            newOrders: {
                percentage: calculatePercentageChange(currentNew, previousNew),
                isIncrease: currentNew >= previousNew,
            },
            processingOrders: {
                percentage: calculatePercentageChange(
                    currentProcessing,
                    previousProcessing,
                ),
                isIncrease: currentProcessing >= previousProcessing,
            },
            completedOrders: {
                percentage: calculatePercentageChange(
                    currentCompleted,
                    previousCompleted,
                ),
                isIncrease: currentCompleted >= previousCompleted,
            },
        };
    }

    static clearCache() {
        DashboardService.cache.clear();
    }
}

module.exports = DashboardService;
