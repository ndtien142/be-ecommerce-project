const { Op, fn, col, literal } = require('sequelize');
const database = require('../models');

module.exports = {
    findOrdersByStatus: (startDate, endDate) =>
        database.Order.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            where: { create_time: { [Op.between]: [startDate, endDate] } },
            group: ['status'],
            raw: true,
        }),

    findPaymentsByStatusAndMethod: (startDate, endDate) =>
        database.Payment.findAll({
            attributes: [
                'payment_method',
                'status',
                [fn('COUNT', col('Payment.id')), 'count'],
                [fn('SUM', col('Payment.amount')), 'totalAmount'],
            ],
            include: [
                {
                    model: database.Order,
                    as: 'order',
                    attributes: [],
                    where: {
                        create_time: { [Op.between]: [startDate, endDate] },
                    },
                },
            ],
            group: ['payment_method', 'status'],
            raw: true,
        }),

    countOrders: (startDate, endDate) =>
        database.Order.count({
            where: { create_time: { [Op.between]: [startDate, endDate] } },
        }),

    countOrderLogs: (startDate, endDate) =>
        database.OrderLog.count({
            where: { created_at: { [Op.between]: [startDate, endDate] } },
        }),

    findOrderLogsByAction: (startDate, endDate) =>
        database.OrderLog.findAll({
            attributes: ['action', [fn('COUNT', col('id')), 'count']],
            where: { created_at: { [Op.between]: [startDate, endDate] } },
            group: ['action'],
            raw: true,
        }),

    findOrderLogsByActor: (startDate, endDate) =>
        database.OrderLog.findAll({
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
            where: { created_at: { [Op.between]: [startDate, endDate] } },
            group: ['actor_type'],
            raw: true,
        }),

    countActiveAdmins: () =>
        database.User.count({
            where: { user_status: 'normal' },
            include: [
                {
                    model: database.Role,
                    as: 'role',
                    where: { name: { [Op.like]: '%admin%' }, status: 'normal' },
                },
            ],
        }),

    countActiveCustomers: () =>
        database.User.count({ where: { user_status: 'normal' } }),

    countCompletedOrders: (startDate, endDate) =>
        database.Order.count({
            where: {
                create_time: { [Op.between]: [startDate, endDate] },
                status: { [Op.in]: ['delivered', 'customer_confirmed'] },
            },
        }),

    getAverageProcessingTime: (startDate, endDate) =>
        database.sequelize.query(
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
                replacements: { startDate, endDate },
                type: database.Sequelize.QueryTypes.SELECT,
            },
        ),

    countPendingConfirmation: () =>
        database.Order.count({ where: { status: 'pending_confirmation' } }),
    countPendingPickup: () =>
        database.Order.count({ where: { status: 'pending_pickup' } }),
    countOverdueOrders: () =>
        database.Order.count({
            where: {
                status: 'shipped',
                shipped_date: {
                    [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
        }),
    countPaymentIssues: () =>
        database.Payment.count({ where: { status: 'failed' } }),

    findRecentOrderLogs: () =>
        database.OrderLog.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            where: {
                created_at: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) },
            },
            include: [
                { model: database.Order, as: 'order', attributes: ['id'] },
            ],
        }),

    sumRevenue: (startDate, endDate) =>
        database.Payment.sum('amount', {
            include: [
                {
                    model: database.Order,
                    as: 'order',
                    where: {
                        create_time: { [Op.between]: [startDate, endDate] },
                    },
                },
            ],
            where: { status: 'completed' },
        }),

    // Thống kê group theo ngày/tuần/tháng/quý/năm
    groupOrderStats: (startDate, endDate, groupBy) => {
        // groupBy: 'day', 'week', 'month', 'quarter', 'year'
        let dateExpr;
        switch (groupBy) {
            case 'day':
                dateExpr = fn('DATE', col('create_time'));
                break;
            case 'week':
                dateExpr = fn('YEARWEEK', col('create_time'), 1); // 1: tuần bắt đầu từ thứ 2
                break;
            case 'month':
                dateExpr = fn('DATE_FORMAT', col('create_time'), '%Y-%m');
                break;
            case 'quarter':
                dateExpr = literal(
                    "CONCAT(YEAR(create_time), '-Q', QUARTER(create_time))",
                );
                break;
            case 'year':
                dateExpr = fn('YEAR', col('create_time'));
                break;
            default:
                dateExpr = fn('DATE', col('create_time'));
        }
        return database.Order.findAll({
            attributes: [
                [dateExpr, 'period'],
                [fn('COUNT', col('id')), 'orders'],
            ],
            where: { create_time: { [Op.between]: [startDate, endDate] } },
            group: ['period'],
            order: [[literal('period'), 'ASC']],
            raw: true,
        });
    },

    groupRevenueStats: (startDate, endDate, groupBy) => {
        let dateExpr;
        switch (groupBy) {
            case 'day':
                dateExpr = fn('DATE', col('order.create_time'));
                break;
            case 'week':
                dateExpr = fn('YEARWEEK', col('order.create_time'), 1);
                break;
            case 'month':
                dateExpr = fn('DATE_FORMAT', col('order.create_time'), '%Y-%m');
                break;
            case 'quarter':
                dateExpr = literal(
                    "CONCAT(YEAR(order.create_time), '-Q', QUARTER(order.create_time))",
                );
                break;
            case 'year':
                dateExpr = fn('YEAR', col('order.create_time'));
                break;
            default:
                dateExpr = fn('DATE', col('order.create_time'));
        }
        return database.Payment.findAll({
            attributes: [
                [dateExpr, 'period'],
                [fn('SUM', col('amount')), 'revenue'],
            ],
            include: [
                {
                    model: database.Order,
                    as: 'order',
                    attributes: [],
                    where: {
                        create_time: { [Op.between]: [startDate, endDate] },
                        status: {
                            [Op.in]: ['delivered', 'customer_confirmed'],
                        },
                    },
                },
            ],
            where: { status: 'completed' },
            group: ['period'],
            order: [[literal('period'), 'ASC']],
            raw: true,
        });
    },

    groupActionStats: (startDate, endDate, groupBy) => {
        let dateExpr;
        switch (groupBy) {
            case 'day':
                dateExpr = fn('DATE', col('created_at'));
                break;
            case 'week':
                dateExpr = fn('YEARWEEK', col('created_at'), 1);
                break;
            case 'month':
                dateExpr = fn('DATE_FORMAT', col('created_at'), '%Y-%m');
                break;
            case 'quarter':
                dateExpr = literal(
                    "CONCAT(YEAR(created_at), '-Q', QUARTER(created_at))",
                );
                break;
            case 'year':
                dateExpr = fn('YEAR', col('created_at'));
                break;
            default:
                dateExpr = fn('DATE', col('created_at'));
        }
        return database.OrderLog.findAll({
            attributes: [
                [dateExpr, 'period'],
                [fn('COUNT', col('id')), 'actions'],
            ],
            where: { created_at: { [Op.between]: [startDate, endDate] } },
            group: ['period'],
            order: [[literal('period'), 'ASC']],
            raw: true,
        });
    },

    // Lấy danh sách đơn hàng mới nhất với pagination
    findRecentOrders: (page = 1, limit = 10, filters = {}) => {
        const { status, userId, startDate, endDate } = filters;
        const offset = (page - 1) * limit;

        // Build where conditions
        const whereConditions = {};

        if (status) {
            whereConditions.status = status;
        }

        if (userId) {
            whereConditions.user_id = userId;
        }

        if (startDate && endDate) {
            whereConditions.create_time = {
                [Op.between]: [
                    new Date(startDate),
                    new Date(endDate + ' 23:59:59'),
                ],
            };
        } else if (startDate) {
            whereConditions.create_time = {
                [Op.gte]: new Date(startDate),
            };
        } else if (endDate) {
            whereConditions.create_time = {
                [Op.lte]: new Date(endDate + ' 23:59:59'),
            };
        }

        return database.Order.findAndCountAll({
            where: whereConditions,
            limit,
            offset,
            order: [['create_time', 'DESC']],
            include: [
                {
                    model: database.User,
                    as: 'user',
                    attributes: ['id', 'user_nickname', 'user_email'],
                },
                {
                    model: database.Payment,
                    as: 'payments',
                    attributes: ['payment_method', 'status', 'amount'],
                },
            ],
            attributes: [
                'id',
                'total_amount',
                'status',
                'create_time',
                'note',
                'tracking_number',
                'shipped_date',
                'delivered_date',
            ],
        });
    },

    // Group MoMo successful payments by time period
    groupMoMoSuccessStats: (startDate, endDate, groupBy) => {
        let dateExpr;
        switch (groupBy) {
            case 'day':
                dateExpr = fn('DATE', col('order.create_time'));
                break;
            case 'week':
                dateExpr = fn('YEARWEEK', col('order.create_time'), 1);
                break;
            case 'month':
                dateExpr = fn('DATE_FORMAT', col('order.create_time'), '%Y-%m');
                break;
            case 'quarter':
                dateExpr = literal(
                    "CONCAT(YEAR(order.create_time), '-Q', QUARTER(order.create_time))",
                );
                break;
            case 'year':
                dateExpr = fn('YEAR', col('order.create_time'));
                break;
            default:
                dateExpr = fn('DATE', col('order.create_time'));
        }
        return database.Payment.findAll({
            attributes: [
                [dateExpr, 'period'],
                [fn('COUNT', col('Payment.id')), 'momoOrders'],
            ],
            include: [
                {
                    model: database.Order,
                    as: 'order',
                    attributes: [],
                    where: {
                        create_time: { [Op.between]: [startDate, endDate] },
                        status: {
                            [Op.in]: ['delivered', 'customer_confirmed'],
                        },
                    },
                },
            ],
            where: {
                status: 'completed',
                payment_method: 'momo',
            },
            group: ['period'],
            order: [[literal('period'), 'ASC']],
            raw: true,
        });
    },

    // Group Cash successful payments by time period
    groupCashSuccessStats: (startDate, endDate, groupBy) => {
        let dateExpr;
        switch (groupBy) {
            case 'day':
                dateExpr = fn('DATE', col('order.create_time'));
                break;
            case 'week':
                dateExpr = fn('YEARWEEK', col('order.create_time'), 1);
                break;
            case 'month':
                dateExpr = fn('DATE_FORMAT', col('order.create_time'), '%Y-%m');
                break;
            case 'quarter':
                dateExpr = literal(
                    "CONCAT(YEAR(order.create_time), '-Q', QUARTER(order.create_time))",
                );
                break;
            case 'year':
                dateExpr = fn('YEAR', col('order.create_time'));
                break;
            default:
                dateExpr = fn('DATE', col('order.create_time'));
        }
        return database.Payment.findAll({
            attributes: [
                [dateExpr, 'period'],
                [fn('COUNT', col('Payment.id')), 'cashOrders'],
            ],
            include: [
                {
                    model: database.Order,
                    as: 'order',
                    attributes: [],
                    where: {
                        create_time: { [Op.between]: [startDate, endDate] },
                        status: {
                            [Op.in]: ['delivered', 'customer_confirmed'],
                        },
                    },
                },
            ],
            where: {
                status: 'completed',
                payment_method: { [Op.in]: ['cash', 'cod'] },
            },
            group: ['period'],
            order: [[literal('period'), 'ASC']],
            raw: true,
        });
    },
};
