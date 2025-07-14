const database = require('../../models');
const { Order, OrderLog, Payment, User, Role, sequelize } = database;
const { Op, literal, fn, col } = require('sequelize');

class DashboardService {
    constructor() {
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.cache = new Map();
    }

    /**
     * Get period dates based on period type
     */
    getPeriodDates(period, startDate, endDate, timezone = 'Asia/Ho_Chi_Minh') {
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
            case 'custom':
                if (!startDate || !endDate) {
                    throw new Error(
                        'startDate and endDate are required for custom period',
                    );
                }
                start = new Date(startDate);
                end = new Date(endDate);
                break;
            default:
                // Default to last 7 days
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

    /**
     * Get orders by status statistics
     */
    async getOrdersByStatus(periodInfo) {
        const statusDisplayNames = {
            pending_confirmation: { name: 'Chờ xác nhận', color: '#ff9800' },
            pending_pickup: { name: 'Chờ lấy hàng', color: '#2196f3' },
            shipping: { name: 'Đang giao hàng', color: '#ff5722' },
            delivered: { name: 'Đã giao hàng', color: '#4caf50' },
            customer_confirmed: { name: 'Đã xác nhận', color: '#8bc34a' },
            returned: { name: 'Đã trả hàng', color: '#9c27b0' },
            cancelled: { name: 'Đã hủy', color: '#f44336' },
        };

        const orderStats = await Order.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            where: {
                create_time: {
                    [Op.between]: [
                        periodInfo.startDateTime,
                        periodInfo.endDateTime,
                    ],
                },
            },
            group: ['status'],
            raw: true,
        });

        const totalOrders = orderStats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );

        return orderStats.map((stat) => ({
            status: stat.status,
            displayName: statusDisplayNames[stat.status]?.name || stat.status,
            count: parseInt(stat.count),
            percentage:
                totalOrders > 0
                    ? ((parseInt(stat.count) / totalOrders) * 100).toFixed(1)
                    : 0,
            color: statusDisplayNames[stat.status]?.color || '#9e9e9e',
        }));
    }

    /**
     * Get payments by status and method statistics
     */
    async getPaymentsByStatusAndMethod(periodInfo) {
        const methodDisplayNames = {
            momo: 'MoMo',
            // vnpay: 'VNPay',
            cod: 'Thanh toán khi nhận hàng',
            cash: 'Tiền mặt',
            // banking: 'Chuyển khoản',
            // bank_transfer: 'Chuyển khoản ngân hàng',
        };

        const paymentStats = await Payment.findAll({
            attributes: [
                'payment_method',
                'status',
                [fn('COUNT', col('Payment.id')), 'count'],
                [fn('SUM', col('Payment.amount')), 'totalAmount'],
            ],
            include: [
                {
                    model: Order,
                    as: 'orders',
                    attributes: [],
                    where: {
                        create_time: {
                            [Op.between]: [
                                periodInfo.startDateTime,
                                periodInfo.endDateTime,
                            ],
                        },
                    },
                },
            ],
            group: ['payment_method', 'status'],
            raw: true,
        });

        const totalPayments = paymentStats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );

        return paymentStats.map((stat) => ({
            method: stat.payment_method,
            displayName:
                methodDisplayNames[stat.payment_method] || stat.payment_method,
            status: stat.status,
            count: parseInt(stat.count),
            totalAmount: parseInt(stat.totalAmount) || 0,
            percentage:
                totalPayments > 0
                    ? ((parseInt(stat.count) / totalPayments) * 100).toFixed(1)
                    : 0,
        }));
    }

    /**
     * Get workflow statistics
     */
    async getWorkflowStatistics(period, startDate, endDate, timezone) {
        const cacheKey = `workflow-stats-${period}-${startDate}-${endDate}`;

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

        const [ordersByStatus, paymentsByStatusAndMethod] = await Promise.all([
            this.getOrdersByStatus(periodInfo),
            this.getPaymentsByStatusAndMethod(periodInfo),
        ]);

        const result = {
            period: periodInfo,
            ordersByStatus,
            paymentsByStatusAndMethod,
        };

        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
        });

        return result;
    }

    /**
     * Get dashboard overview statistics
     */
    async getDashboardOverview(period, startDate, endDate, timezone) {
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
            trends,
            pendingAlerts,
        ] = await Promise.all([
            this.getTotalOrders(periodInfo),
            this.getTotalActions(periodInfo),
            this.getActionStats(periodInfo),
            this.getActorStats(periodInfo),
            this.getTrends(periodInfo),
            this.getPendingAlerts(),
        ]);

        const completionRate = await this.calculateCompletionRate(periodInfo);
        const averageProcessingTime =
            await this.getAverageProcessingTime(periodInfo);

        const result = {
            period: periodInfo,
            totalOrders,
            totalActions,
            completionRate,
            averageProcessingTime,
            trends,
            pendingAlerts,
            actionStats,
            actorStats,
        };

        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
        });

        return result;
    }

    /**
     * Get total orders count
     */
    async getTotalOrders(periodInfo) {
        const result = await Order.count({
            where: {
                create_time: {
                    [Op.between]: [
                        periodInfo.startDateTime,
                        periodInfo.endDateTime,
                    ],
                },
            },
        });

        return result;
    }

    /**
     * Get total actions count
     */
    async getTotalActions(periodInfo) {
        const result = await OrderLog.count({
            where: {
                created_at: {
                    [Op.between]: [
                        periodInfo.startDateTime,
                        periodInfo.endDateTime,
                    ],
                },
            },
        });

        return result;
    }

    /**
     * Get action statistics
     */
    async getActionStats(periodInfo) {
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

        const actionStats = await OrderLog.findAll({
            attributes: ['action', [fn('COUNT', col('id')), 'count']],
            where: {
                created_at: {
                    [Op.between]: [
                        periodInfo.startDateTime,
                        periodInfo.endDateTime,
                    ],
                },
            },
            group: ['action'],
            raw: true,
        });

        const totalActions = actionStats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );

        // Get previous period for trend calculation
        const previousPeriodStart = new Date(
            periodInfo.startDateTime.getTime() -
                (periodInfo.endDateTime.getTime() -
                    periodInfo.startDateTime.getTime()),
        );
        const previousPeriodEnd = periodInfo.startDateTime;

        const previousActionStats = await OrderLog.findAll({
            attributes: ['action', [fn('COUNT', col('id')), 'count']],
            where: {
                created_at: {
                    [Op.between]: [previousPeriodStart, previousPeriodEnd],
                },
            },
            group: ['action'],
            raw: true,
        });

        const previousStatsMap = previousActionStats.reduce((map, stat) => {
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

    /**
     * Get actor statistics
     */
    async getActorStats(periodInfo) {
        const actorDisplayNames = {
            system: 'Hệ thống',
            admin: 'Quản trị viên',
            customer: 'Khách hàng',
            shipper: 'Người giao hàng',
            payment_gateway: 'Cổng thanh toán',
        };

        const actorStats = await OrderLog.findAll({
            attributes: [
                'actor_type',
                [fn('COUNT', col('id')), 'count'],
                [
                    fn(
                        'AVG',
                        literal(
                            'TIMESTAMPDIFF(MINUTE, created_at, updated_at)',
                        ),
                    ),
                    'averageResponseTime',
                ],
            ],
            where: {
                created_at: {
                    [Op.between]: [
                        periodInfo.startDateTime,
                        periodInfo.endDateTime,
                    ],
                },
            },
            group: ['actor_type'],
            raw: true,
        });

        const totalActions = actorStats.reduce(
            (sum, stat) => sum + parseInt(stat.count),
            0,
        );

        const actorStatsWithActive = await Promise.all(
            actorStats.map(async (stat) => {
                let activeCount = null;

                if (stat.actor_type === 'admin') {
                    activeCount = await User.count({
                        where: {
                            user_status: 'normal',
                        },
                        include: [
                            {
                                model: Role,
                                as: 'role',
                                where: {
                                    name: {
                                        [Op.like]: '%admin%',
                                    },
                                    status: 'normal',
                                },
                            },
                        ],
                    });
                } else if (stat.actor_type === 'customer') {
                    activeCount = await User.count({
                        where: {
                            user_status: 'normal',
                        },
                    });
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

    /**
     * Calculate completion rate based on order status, not actions
     */
    async calculateCompletionRate(periodInfo) {
        const [totalOrders, completedOrders] = await Promise.all([
            Order.count({
                where: {
                    create_time: {
                        [Op.between]: [
                            periodInfo.startDateTime,
                            periodInfo.endDateTime,
                        ],
                    },
                },
            }),
            Order.count({
                where: {
                    create_time: {
                        [Op.between]: [
                            periodInfo.startDateTime,
                            periodInfo.endDateTime,
                        ],
                    },
                    status: {
                        [Op.in]: ['delivered', 'customer_confirmed'],
                    },
                },
            }),
        ]);

        return totalOrders > 0
            ? ((completedOrders / totalOrders) * 100).toFixed(1)
            : 0;
    }

    /**
     * Get average processing time
     */
    async getAverageProcessingTime(periodInfo) {
        const result = await sequelize.query(
            `
            SELECT AVG(TIMESTAMPDIFF(MINUTE, o.create_time, 
                CASE 
                    WHEN o.status = 'customer_confirmed' THEN o.customer_confirmed_date
                    WHEN o.status = 'delivered' THEN o.delivered_date
                    WHEN o.status = 'cancelled' THEN o.update_time
                    ELSE o.update_time
                END
            )) as averageTime
            FROM tb_order o
            WHERE o.create_time BETWEEN :startDate AND :endDate
            AND o.status IN ('customer_confirmed', 'delivered', 'cancelled')
        `,
            {
                replacements: {
                    startDate: periodInfo.startDateTime,
                    endDate: periodInfo.endDateTime,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        );

        return parseFloat(result[0]?.averageTime) || 0;
    }

    /**
     * Get trends compared to previous period
     */
    async getTrends(periodInfo) {
        const currentPeriodLength =
            periodInfo.endDateTime.getTime() -
            periodInfo.startDateTime.getTime();
        const previousPeriodStart = new Date(
            periodInfo.startDateTime.getTime() - currentPeriodLength,
        );
        const previousPeriodEnd = periodInfo.startDateTime;

        const [currentStats, previousStats] = await Promise.all([
            this.getPeriodStats(
                periodInfo.startDateTime,
                periodInfo.endDateTime,
            ),
            this.getPeriodStats(previousPeriodStart, previousPeriodEnd),
        ]);

        const calculateGrowth = (current, previous) => {
            return previous > 0
                ? (((current - previous) / previous) * 100).toFixed(1)
                : 0;
        };

        return {
            ordersGrowth: parseFloat(
                calculateGrowth(currentStats.orders, previousStats.orders),
            ),
            actionsGrowth: parseFloat(
                calculateGrowth(currentStats.actions, previousStats.actions),
            ),
            completionRateChange: parseFloat(
                calculateGrowth(
                    currentStats.completionRate,
                    previousStats.completionRate,
                ),
            ),
            processingTimeChange: parseFloat(
                calculateGrowth(
                    currentStats.processingTime,
                    previousStats.processingTime,
                ),
            ),
        };
    }

    /**
     * Get period statistics for trend calculation
     */
    async getPeriodStats(startDate, endDate) {
        const [ordersCount, actionsCount, completedOrders, processingTime] =
            await Promise.all([
                Order.count({
                    where: {
                        create_time: {
                            [Op.between]: [startDate, endDate],
                        },
                    },
                }),
                OrderLog.count({
                    where: {
                        created_at: {
                            [Op.between]: [startDate, endDate],
                        },
                    },
                }),
                Order.count({
                    where: {
                        create_time: {
                            [Op.between]: [startDate, endDate],
                        },
                        status: {
                            [Op.in]: ['delivered', 'customer_confirmed'],
                        },
                    },
                }),
                // Add processing time calculation
                45.0, // Placeholder
            ]);

        const completionRate =
            ordersCount > 0 ? (completedOrders / ordersCount) * 100 : 0;

        return {
            orders: ordersCount,
            actions: actionsCount,
            completionRate,
            processingTime,
        };
    }

    /**
     * Get pending alerts
     */
    async getPendingAlerts() {
        const [
            pendingConfirmation,
            pendingPickup,
            overdueOrders,
            paymentIssues,
        ] = await Promise.all([
            Order.count({
                where: { status: 'pending_confirmation' },
            }),
            Order.count({
                where: { status: 'pending_pickup' },
            }),
            Order.count({
                where: {
                    status: 'shipped',
                    shipped_date: {
                        [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    },
                },
            }),
            Payment.count({
                where: {
                    status: 'failed',
                },
            }),
        ]);

        return {
            pendingConfirmation,
            pendingPickup,
            overdueOrders,
            paymentIssues,
        };
    }

    /**
     * Get time series data
     */
    async getTimeSeriesData(
        period,
        startDate,
        endDate,
        granularity = 'day',
        metrics = 'orders,revenue,actions',
    ) {
        const periodInfo = this.getPeriodDates(period, startDate, endDate);
        const metricsArray = metrics.split(',').map((m) => m.trim());

        const timeSeries = [];
        const current = new Date(periodInfo.startDateTime);

        while (current <= periodInfo.endDateTime) {
            const nextPeriod = new Date(current);

            switch (granularity) {
                case 'hour':
                    nextPeriod.setHours(current.getHours() + 1);
                    break;
                case 'day':
                    nextPeriod.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    nextPeriod.setDate(current.getDate() + 7);
                    break;
                default:
                    nextPeriod.setDate(current.getDate() + 1);
            }

            const dataPoint = {
                date: current.toISOString().split('T')[0],
            };

            // Get metrics for this time period
            if (metricsArray.includes('orders')) {
                dataPoint.orders = await Order.count({
                    where: {
                        create_time: {
                            [Op.between]: [current, nextPeriod],
                        },
                    },
                });
            }

            if (metricsArray.includes('revenue')) {
                const revenue = await Payment.sum('amount', {
                    include: [
                        {
                            model: Order,
                            as: 'orders',
                            where: {
                                create_time: {
                                    [Op.between]: [current, nextPeriod],
                                },
                            },
                        },
                    ],
                    where: {
                        status: 'completed',
                    },
                });
                dataPoint.revenue = revenue || 0;
            }

            if (metricsArray.includes('actions')) {
                dataPoint.actions = await OrderLog.count({
                    where: {
                        created_at: {
                            [Op.between]: [current, nextPeriod],
                        },
                    },
                });
            }

            // Calculate completion rate if needed
            if (metricsArray.includes('completionRate')) {
                const [totalOrders, completedOrders] = await Promise.all([
                    Order.count({
                        where: {
                            create_time: {
                                [Op.between]: [current, nextPeriod],
                            },
                        },
                    }),
                    Order.count({
                        where: {
                            create_time: {
                                [Op.between]: [current, nextPeriod],
                            },
                            status: {
                                [Op.in]: ['delivered', 'customer_confirmed'],
                            },
                        },
                    }),
                ]);

                dataPoint.completionRate =
                    totalOrders > 0
                        ? ((completedOrders / totalOrders) * 100).toFixed(1)
                        : 0;
            }

            timeSeries.push(dataPoint);
            current.setTime(nextPeriod.getTime());
        }

        return {
            period: periodInfo,
            timeSeries,
        };
    }

    /**
     * Get real-time metrics
     */
    async getRealtimeMetrics() {
        const [activeOrders, totalUsers, pendingActions, recentActivities] =
            await Promise.all([
                Order.count({
                    where: {
                        status: {
                            [Op.in]: [
                                'pending_confirmation',
                                'pending_pickup',
                                'shipping',
                            ],
                        },
                    },
                }),
                User.count({
                    where: {
                        user_status: 'normal',
                    },
                }),
                OrderLog.count({
                    where: {
                        created_at: {
                            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                        },
                    },
                }),
                this.getRecentActivities(),
            ]);

        return {
            timestamp: new Date().toISOString(),
            activeOrders,
            totalUsers,
            pendingActions,
            systemHealth: {
                status: 'healthy',
                responseTime: 156, // This should be calculated from actual metrics
                uptime: 99.98,
            },
            recentActivities,
        };
    }

    /**
     * Get recent activities
     */
    async getRecentActivities() {
        const recentLogs = await OrderLog.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            where: {
                created_at: {
                    [Op.gte]: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                },
            },
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: ['id'],
                },
            ],
        });

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

    /**
     * Get action description
     */
    getActionDescription(action, actorName) {
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

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = new DashboardService();
