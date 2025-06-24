'use strict';

const OrderService = require('../services/order/order.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class OrderController {
    createOrder = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new CREATED({
            message: 'Order created successfully',
            metadata: await OrderService.createOrder({ ...req.body, userId }),
        }).send(res);
    };

    getOrderById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await OrderService.getOrderById(req.params.id),
        }).send(res);
    };

    getOrdersByUser = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new SuccessResponse({
            metadata: await OrderService.getOrdersByUser(userId, req.query),
        }).send(res);
    };

    updateOrderStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Order status updated successfully',
            metadata: await OrderService.updateOrderStatus(
                req.params.id,
                req.body.status,
            ),
        }).send(res);
    };

    cancelOrder = async (req, res, next) => {
        new SuccessResponse({
            message: 'Order cancelled successfully',
            metadata: await OrderService.cancelOrder(req.params.id),
        }).send(res);
    };

    updateOrderAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Order address updated successfully',
            metadata: await OrderService.updateOrderAddress(
                req.params.id,
                req.body.addressId,
            ),
        }).send(res);
    };

    countOrdersByStatus = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new SuccessResponse({
            message: 'Order status count',
            metadata: await OrderService.countOrdersByStatus(userId),
        }).send(res);
    };
}

module.exports = new OrderController();
