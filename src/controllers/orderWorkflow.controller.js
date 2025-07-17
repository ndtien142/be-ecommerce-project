'use strict';

const { SuccessResponse } = require('../core/success.response');
const OrderWorkflowService = require('../services/order/orderWorkflow.service');
const { asyncHandler } = require('../helpers/asyncHandler');

class OrderWorkflowController {
    /**
     * Xác nhận đơn hàng
     * POST /api/v1/order/workflow/:orderId/confirm
     */
    confirmOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { note } = req.body;
        const actorId = req.user?.id;
        const actorName = req.user?.first_name || req.user?.username;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const order = await OrderWorkflowService.confirmOrder(
            orderId,
            actorId,
            actorName,
            note,
            ipAddress,
            userAgent,
        );

        new SuccessResponse({
            message: 'Xác nhận đơn hàng thành công',
            metadata: order,
        }).send(res);
    });

    /**
     * Shipper lấy hàng
     * POST /api/v1/order/workflow/:orderId/pickup
     */
    pickupOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { trackingNumber, shippedBy, note } = req.body;
        const actorId = req.user?.id;
        const actorName = req.user?.first_name || req.user?.username;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const order = await OrderWorkflowService.pickupOrder(
            orderId,
            trackingNumber,
            shippedBy,
            actorId,
            actorName,
            note,
            ipAddress,
            userAgent,
        );

        new SuccessResponse({
            message: 'Lấy hàng thành công',
            metadata: order,
        }).send(res);
    });

    /**
     * Giao hàng thành công
     * POST /api/v1/order/workflow/:orderId/deliver
     */
    deliverOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { note } = req.body;
        const actorId = req.user?.id;
        const actorName = req.user?.first_name || req.user?.username;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const order = await OrderWorkflowService.deliverOrder(
            orderId,
            actorId,
            actorName,
            note,
            ipAddress,
            userAgent,
        );

        new SuccessResponse({
            message: 'Giao hàng thành công',
            metadata: order,
        }).send(res);
    });

    /**
     * Shipper nộp tiền COD
     * POST /api/v1/order/workflow/:orderId/complete-cod
     */
    completeCODPayment = asyncHandler(async (req, res) => {
        const { orderId } = req.params;

        const order = await OrderWorkflowService.completeCODPayment(orderId);

        new SuccessResponse({
            message: 'Thu tiền COD thành công',
            metadata: order,
        }).send(res);
    });

    /**
     * Trả hàng / Không nhận hàng
     * POST /api/v1/order/workflow/:orderId/return
     */
    returnOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await OrderWorkflowService.returnOrder(orderId, reason);

        new SuccessResponse({
            message: 'Trả hàng thành công',
            metadata: order,
        }).send(res);
    });

    /**
     * Hủy đơn hàng
     * POST /api/v1/order/workflow/:orderId/cancel
     */
    cancelOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await OrderWorkflowService.cancelOrder(orderId, reason);

        new SuccessResponse({
            message: 'Hủy đơn hàng thành công',
            metadata: order,
        }).send(res);
    });

    /**
     * Lấy workflow hiện tại
     * GET /api/v1/order/workflow/:orderId
     */
    getOrderWorkflow = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const userId = req.user?.userId; // Optional: pass userId if needed for permissions

        const workflow = await OrderWorkflowService.getOrderWorkflow(
            orderId,
            userId,
        );

        new SuccessResponse({
            message: 'Lấy workflow đơn hàng thành công',
            metadata: workflow,
        }).send(res);
    });

    /**
     * Thống kê đơn hàng
     * GET /api/v1/order/workflow/statistics
     */
    getOrderStatistics = asyncHandler(async (req, res) => {
        const statistics = await OrderWorkflowService.getOrderStatistics();

        new SuccessResponse({
            message: 'Lấy thống kê đơn hàng thành công',
            metadata: statistics,
        }).send(res);
    });

    /**
     * Khách hàng xác nhận đã nhận hàng
     * POST /api/v1/order/workflow/:orderId/customer-confirm
     */
    customerConfirmOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { note } = req.body;
        const customerId = req.user.id;
        const customerName = req.user.first_name || req.user.username;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        const order = await OrderWorkflowService.customerConfirmOrder(
            orderId,
            customerId,
            customerName,
            note,
            ipAddress,
            userAgent,
        );

        new SuccessResponse({
            message: 'Xác nhận nhận hàng thành công',
            metadata: order,
        }).send(res);
    });
}

module.exports = new OrderWorkflowController();
