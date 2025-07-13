'use strict';

const OrderService = require('../services/order/order.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class OrderController {
    createOrder = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new CREATED({
            message: 'Tạo đơn hàng thành công',
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

    getOrdersByAdmin = async (req, res, next) => {
        new SuccessResponse({
            metadata: await OrderService.getOrdersByAdmin(req.query),
        }).send(res);
    };

    updateOrderStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật trạng thái đơn hàng thành công',
            metadata: await OrderService.updateOrderStatus(
                req.params.id,
                req.body.status,
            ),
        }).send(res);
    };

    cancelOrder = async (req, res, next) => {
        new SuccessResponse({
            message: 'Hủy đơn hàng thành công',
            metadata: await OrderService.cancelOrder(req.params.id),
        }).send(res);
    };

    updateOrderAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật địa chỉ đơn hàng thành công',
            metadata: await OrderService.updateOrderAddress(
                req.params.id,
                req.body.addressId,
            ),
        }).send(res);
    };

    countOrdersByStatus = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new SuccessResponse({
            message: 'Đếm đơn hàng theo trạng thái',
            metadata: await OrderService.countOrdersByStatus(userId),
        }).send(res);
    };

    getOrderByIdForUser = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new SuccessResponse({
            metadata: await OrderService.getOrderByIdForUser(
                req.params.id,
                userId,
            ),
        }).send(res);
    };

    countOrdersByStatusForAdmin = async (req, res, next) => {
        new SuccessResponse({
            message: 'Đếm đơn hàng theo trạng thái cho quản trị viên',
            metadata: await OrderService.countOrdersByStatusForAdmin(),
        }).send(res);
    };

    /**
     * Create order with MoMo payment
     */
    createOrderWithMoMo = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new CREATED({
            message: 'Tạo đơn hàng với thanh toán MoMo thành công',
            metadata: await OrderService.createOrderWithMoMo({
                ...req.body,
                userId,
            }),
        }).send(res);
    };
}

module.exports = new OrderController();
