'use strict';

const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');
const { Op } = require('sequelize');

/**
 * Service để quản lý log trạng thái đơn hàng
 */
class OrderLogService {
    /**
     * Tạo log khi chuyển trạng thái đơn hàng
     */
    static async createLog({
        orderId,
        fromStatus = null,
        toStatus,
        action,
        actorType,
        actorId = null,
        actorName = null,
        note = null,
        metadata = null,
        ipAddress = null,
        userAgent = null,
        transaction = null, // Thêm transaction parameter
    }) {
        try {
            const log = await database.OrderLog.create(
                {
                    order_id: parseInt(orderId),
                    from_status: fromStatus,
                    to_status: toStatus,
                    action,
                    actor_type: actorType,
                    actor_id: parseInt(actorId) || 0,
                    actor_name: actorName,
                    note,
                    metadata,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                },
                transaction ? { transaction } : {},
            );

            return toCamel(log.toJSON());
        } catch (error) {
            console.error('Error creating order log:', error);
            throw error;
        }
    }

    /**
     * Lấy lịch sử log của đơn hàng
     */
    static async getOrderLogs(orderId, limit = 50, offset = 0) {
        try {
            const logs = await database.OrderLog.findAndCountAll({
                where: { order_id: orderId },
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            return {
                logs: logs.rows.map((log) => toCamel(log.toJSON())),
                total: logs.count,
                limit,
                offset,
            };
        } catch (error) {
            console.error('Error getting order logs:', error);
            throw error;
        }
    }

    /**
     * Lấy log theo action
     */
    static async getLogsByAction(action, limit = 100, offset = 0) {
        try {
            const logs = await database.OrderLog.findAndCountAll({
                where: { action },
                include: [
                    {
                        model: database.Order,
                        as: 'order',
                        attributes: [
                            'id',
                            'status',
                            'total_amount',
                            'created_at',
                        ],
                    },
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            return {
                logs: logs.rows.map((log) => toCamel(log.toJSON())),
                total: logs.count,
                limit,
                offset,
            };
        } catch (error) {
            console.error('Error getting logs by action:', error);
            throw error;
        }
    }

    /**
     * Lấy thống kê log theo actor
     */
    static async getLogStatsByActor(startDate = null, endDate = null) {
        try {
            let whereClause = {};

            if (startDate || endDate) {
                whereClause.created_at = {};
                if (startDate) whereClause.created_at[Op.gte] = startDate;
                if (endDate) whereClause.created_at[Op.lte] = endDate;
            }

            const stats = await database.OrderLog.findAll({
                where: whereClause,
                attributes: [
                    'actor_type',
                    'action',
                    [
                        database.sequelize.fn(
                            'COUNT',
                            database.sequelize.col('id'),
                        ),
                        'count',
                    ],
                ],
                group: ['actor_type', 'action'],
                order: [
                    ['actor_type', 'ASC'],
                    ['action', 'ASC'],
                ],
            });

            return stats.map((stat) => ({
                actorType: stat.actor_type,
                action: stat.action,
                count: parseInt(stat.get('count')),
            }));
        } catch (error) {
            console.error('Error getting log stats by actor:', error);
            throw error;
        }
    }

    /**
     * Lấy timeline của đơn hàng (dạng đẹp cho UI)
     */
    static async getOrderTimeline(orderId) {
        try {
            const logs = await database.OrderLog.findAll({
                where: { order_id: orderId },
                order: [['created_at', 'ASC']],
            });

            const timeline = logs.map((log) => {
                const item = toCamel(log.toJSON());

                // Thêm icon và color cho UI
                item.icon = this.getActionIcon(log.action);
                item.color = this.getActionColor(log.action);
                item.title = this.getActionTitle(log.action);
                item.description = this.getActionDescription(log);

                return item;
            });

            return timeline;
        } catch (error) {
            console.error('Error getting order timeline:', error);
            throw error;
        }
    }

    /**
     * Lấy icon cho action
     */
    static getActionIcon(action) {
        const icons = {
            created: '🆕',
            confirmed: '✅',
            picked_up: '📦',
            shipped: '🚚',
            delivered: '🏠',
            customer_confirmed: '👤',
            returned: '↩️',
            cancelled: '❌',
            cod_completed: '💰',
            payment_completed: '💳',
            refunded: '💸',
        };
        return icons[action] || '📋';
    }

    /**
     * Lấy color cho action
     */
    static getActionColor(action) {
        const colors = {
            created: 'blue',
            confirmed: 'green',
            picked_up: 'orange',
            shipped: 'purple',
            delivered: 'cyan',
            customer_confirmed: 'lime',
            returned: 'red',
            cancelled: 'red',
            cod_completed: 'green',
            payment_completed: 'green',
            refunded: 'yellow',
        };
        return colors[action] || 'gray';
    }

    /**
     * Lấy title cho action
     */
    static getActionTitle(action) {
        const titles = {
            created: 'Tạo đơn hàng',
            confirmed: 'Xác nhận đơn hàng',
            picked_up: 'Lấy hàng',
            shipped: 'Bắt đầu giao hàng',
            delivered: 'Giao hàng thành công',
            customer_confirmed: 'Khách hàng xác nhận nhận hàng',
            returned: 'Trả hàng',
            cancelled: 'Hủy đơn hàng',
            cod_completed: 'Hoàn tất COD',
            payment_completed: 'Thanh toán hoàn tất',
            refunded: 'Hoàn tiền',
        };
        return titles[action] || 'Cập nhật trạng thái';
    }

    /**
     * Lấy description cho action
     */
    static getActionDescription(log) {
        let description = '';

        // Thêm thông tin actor
        if (log.actor_name) {
            description += `Bởi: ${log.actor_name}`;
        } else if (log.actor_type === 'system') {
            description += 'Tự động bởi hệ thống';
        } else if (log.actor_type === 'payment_gateway') {
            description += 'Cập nhật từ cổng thanh toán';
        }

        // Thêm note nếu có
        if (log.note) {
            description += description ? ` • ${log.note}` : log.note;
        }

        // Thêm metadata quan trọng
        if (log.metadata) {
            if (log.metadata.tracking_number) {
                description += ` • Mã vận đơn: ${log.metadata.tracking_number}`;
            }
            if (log.metadata.refund_amount) {
                description += ` • Số tiền hoàn: ${log.metadata.refund_amount.toLocaleString()} VND`;
            }
            if (log.metadata.payment_method) {
                description += ` • Phương thức: ${log.metadata.payment_method}`;
            }
        }

        return description;
    }

    /**
     * Lấy các log cần xử lý (delivered chưa customer_confirmed)
     */
    static async getPendingConfirmationOrders(limit = 50, offset = 0) {
        try {
            // Lấy các đơn hàng có trạng thái delivered nhưng chưa có customer_confirmed
            const deliveredOrders = await database.sequelize.query(
                `
                SELECT DISTINCT o.id, o.status, o.delivered_date, o.user_id, o.total_amount,
                       u.first_name, u.last_name, u.email, u.phone
                FROM tb_order o
                JOIN tb_user u ON o.user_id = u.id
                WHERE o.status = 'delivered'
                AND NOT EXISTS (
                    SELECT 1 FROM tb_order_log ol 
                    WHERE ol.order_id = o.id 
                    AND ol.action = 'customer_confirmed'
                )
                ORDER BY o.delivered_date ASC
                LIMIT :limit OFFSET :offset
            `,
                {
                    replacements: { limit, offset },
                    type: database.sequelize.QueryTypes.SELECT,
                },
            );

            const countResult = await database.sequelize.query(
                `
                SELECT COUNT(DISTINCT o.id) as total
                FROM tb_order o
                WHERE o.status = 'delivered'
                AND NOT EXISTS (
                    SELECT 1 FROM tb_order_log ol 
                    WHERE ol.order_id = o.id 
                    AND ol.action = 'customer_confirmed'
                )
            `,
                {
                    type: database.sequelize.QueryTypes.SELECT,
                },
            );

            return {
                orders: deliveredOrders.map((order) => toCamel(order)),
                total: countResult[0].total,
                limit,
                offset,
            };
        } catch (error) {
            console.error('Error getting pending confirmation orders:', error);
            throw error;
        }
    }

    /**
     * Lấy dashboard statistics
     */
    static async getDashboardStats(startDate = null, endDate = null) {
        try {
            let whereClause = {};

            if (startDate || endDate) {
                whereClause.created_at = {};
                if (startDate) whereClause.created_at[Op.gte] = startDate;
                if (endDate) whereClause.created_at[Op.lte] = endDate;
            }

            // Thống kê theo action
            const actionStats = await database.OrderLog.findAll({
                where: whereClause,
                attributes: [
                    'action',
                    [
                        database.sequelize.fn(
                            'COUNT',
                            database.sequelize.col('id'),
                        ),
                        'count',
                    ],
                ],
                group: ['action'],
                order: [['action', 'ASC']],
            });

            // Thống kê theo actor_type
            const actorStats = await database.OrderLog.findAll({
                where: whereClause,
                attributes: [
                    'actor_type',
                    [
                        database.sequelize.fn(
                            'COUNT',
                            database.sequelize.col('id'),
                        ),
                        'count',
                    ],
                ],
                group: ['actor_type'],
                order: [['actor_type', 'ASC']],
            });

            // Thống kê theo ngày (7 ngày gần nhất)
            const dailyStats = await database.sequelize.query(
                `
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM tb_order_log
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ${whereClause.created_at ? 'AND created_at >= :startDate AND created_at <= :endDate' : ''}
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `,
                {
                    replacements: {
                        startDate:
                            startDate ||
                            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        endDate: endDate || new Date(),
                    },
                    type: database.sequelize.QueryTypes.SELECT,
                },
            );

            return {
                actionStats: actionStats.map((stat) => ({
                    action: stat.action,
                    count: parseInt(stat.get('count')),
                })),
                actorStats: actorStats.map((stat) => ({
                    actorType: stat.actor_type,
                    count: parseInt(stat.get('count')),
                })),
                dailyStats: dailyStats.map((stat) => ({
                    date: stat.date,
                    count: parseInt(stat.count),
                })),
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }
}

module.exports = OrderLogService;
