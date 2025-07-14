'use strict';

const { SuccessResponse } = require('../core/success.response');
const OrderLogService = require('../services/order/orderLog.service');
const OrderWorkflowService = require('../services/order/orderWorkflow.service');
const { asyncHandler } = require('../helpers/asyncHandler');
const database = require('../models');
const { Op } = require('sequelize');

class OrderLogController {
    /**
     * Lấy lịch sử log của đơn hàng
     * GET /api/v1/order/logs/:orderId
     */
    getOrderLogs = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await OrderLogService.getOrderLogs(
            orderId,
            parseInt(limit),
            parseInt(offset),
        );

        new SuccessResponse({
            message: 'Lấy lịch sử đơn hàng thành công',
            metadata: result,
        }).send(res);
    });

    /**
     * Lấy timeline của đơn hàng (dạng đẹp cho UI)
     * GET /api/v1/order/logs/:orderId/timeline
     */
    getOrderTimeline = asyncHandler(async (req, res) => {
        const { orderId } = req.params;

        const timeline = await OrderLogService.getOrderTimeline(orderId);

        new SuccessResponse({
            message: 'Lấy timeline đơn hàng thành công',
            metadata: { timeline },
        }).send(res);
    });

    /**
     * Lấy log theo action
     * GET /api/v1/order/logs/action/:action
     */
    getLogsByAction = asyncHandler(async (req, res) => {
        const { action } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        const result = await OrderLogService.getLogsByAction(
            action,
            parseInt(limit),
            parseInt(offset),
        );

        new SuccessResponse({
            message: 'Lấy log theo hành động thành công',
            metadata: result,
        }).send(res);
    });

    /**
     * Lấy thống kê log theo actor
     * GET /api/v1/order/logs/stats/actor
     */
    getLogStatsByActor = asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;

        const stats = await OrderLogService.getLogStatsByActor(
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null,
        );

        new SuccessResponse({
            message: 'Lấy thống kê log theo actor thành công',
            metadata: { stats },
        }).send(res);
    });

    /**
     * Lấy dashboard statistics
     * GET /api/v1/order/logs/dashboard
     */
    getDashboardStats = asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;

        const stats = await OrderLogService.getDashboardStats(
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null,
        );

        new SuccessResponse({
            message: 'Lấy thống kê dashboard thành công',
            metadata: stats,
        }).send(res);
    });

    /**
     * Lấy các đơn hàng cần xác nhận từ khách hàng
     * GET /api/v1/order/logs/pending-confirmation
     */
    getPendingConfirmationOrders = asyncHandler(async (req, res) => {
        const { limit = 50, offset = 0 } = req.query;

        const result = await OrderLogService.getPendingConfirmationOrders(
            parseInt(limit),
            parseInt(offset),
        );

        new SuccessResponse({
            message: 'Lấy danh sách đơn hàng chờ xác nhận thành công',
            metadata: result,
        }).send(res);
    });

    /**
     * Admin xem tất cả logs (có phân trang và filter)
     * GET /api/v1/order/logs/admin/all
     */
    getAllLogsForAdmin = asyncHandler(async (req, res) => {
        const {
            limit = 100,
            offset = 0,
            action,
            actorType,
            startDate,
            endDate,
            orderId,
        } = req.query;

        let whereClause = {};

        if (action) whereClause.action = action;
        if (actorType) whereClause.actor_type = actorType;
        if (orderId) whereClause.order_id = orderId;
        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) whereClause.created_at[Op.gte] = new Date(startDate);
            if (endDate) whereClause.created_at[Op.lte] = new Date(endDate);
        }

        const logs = await database.OrderLog.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: database.Order,
                    as: 'order',
                    attributes: ['id', 'status', 'total_amount', 'user_id'],
                    include: [
                        {
                            model: database.User,
                            as: 'user',
                            attributes: [
                                'id',
                                'first_name',
                                'last_name',
                                'email',
                            ],
                        },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        new SuccessResponse({
            message: 'Lấy tất cả logs thành công',
            metadata: {
                logs: logs.rows,
                total: logs.count,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        }).send(res);
    });
}

module.exports = new OrderLogController();
