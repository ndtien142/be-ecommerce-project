'use strict';

const express = require('express');
const router = express.Router();
const OrderWorkflowController = require('../../controllers/orderWorkflow.controller');
const { authenticationV2 } = require('../../auth/authUtils');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderWorkflowResponse:
 *       type: object
 *       properties:
 *         currentStatus:
 *           type: string
 *           enum: [pending_confirmation, pending_pickup, shipping, delivered, customer_confirmed, returned, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, expired, refunded]
 *         paymentMethod:
 *           type: string
 *           enum: [cash, momo, vnpay, bank_transfer]
 *         availableActions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [confirm, pickup, deliver, customer_confirm, complete_cod_payment, return, cancel]
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}:
 *   get:
 *     summary: Lấy workflow hiện tại của đơn hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Lấy workflow thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Lấy workflow đơn hàng thành công
 *                 metadata:
 *                   $ref: '#/components/schemas/OrderWorkflowResponse'
 *       404:
 *         description: Đơn hàng không tồn tại
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/confirm:
 *   post:
 *     summary: Xác nhận đơn hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Ghi chú khi xác nhận
 *     responses:
 *       200:
 *         description: Xác nhận đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Xác nhận đơn hàng thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng không thể xác nhận
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/pickup:
 *   post:
 *     summary: Shipper lấy hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: Mã vận đơn
 *               shippedBy:
 *                 type: string
 *                 description: Tên người giao hàng
 *               note:
 *                 type: string
 *                 description: Ghi chú
 *     responses:
 *       200:
 *         description: Lấy hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Lấy hàng thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng không thể lấy hàng
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/deliver:
 *   post:
 *     summary: Giao hàng thành công (shipper xác nhận)
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Ghi chú khi giao hàng
 *     responses:
 *       200:
 *         description: Giao hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Giao hàng thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng không thể giao
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/customer-confirm:
 *   post:
 *     summary: Khách hàng xác nhận đã nhận hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Ghi chú của khách hàng
 *     responses:
 *       200:
 *         description: Xác nhận nhận hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Xác nhận nhận hàng thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng chưa được giao không thể xác nhận
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/complete-cod:
 *   post:
 *     summary: Shipper nộp tiền COD
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Ghi chú khi nộp tiền COD
 *     responses:
 *       200:
 *         description: Thu tiền COD thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Thu tiền COD thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng không phải COD hoặc đã thu tiền
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/return:
 *   post:
 *     summary: Trả hàng / Không nhận hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do trả hàng
 *                 required: true
 *     responses:
 *       200:
 *         description: Trả hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Trả hàng thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng không thể trả hàng
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/{orderId}/cancel:
 *   post:
 *     summary: Hủy đơn hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do hủy đơn hàng
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Hủy đơn hàng thành công
 *                 metadata:
 *                   type: object
 *                   description: Thông tin đơn hàng đã cập nhật
 *       400:
 *         description: Đơn hàng không thể hủy
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/workflow/statistics:
 *   get:
 *     summary: Thống kê đơn hàng
 *     tags: [Order Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Lấy thống kê đơn hàng thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     ordersByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     paymentsByStatusAndMethod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           method:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalAmount:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */

router.use(authenticationV2);

// Route handlers
router.get('/statistics', OrderWorkflowController.getOrderStatistics);
router.get('/:orderId', OrderWorkflowController.getOrderWorkflow);

router.post('/:orderId/confirm', OrderWorkflowController.confirmOrder);
router.post('/:orderId/pickup', OrderWorkflowController.pickupOrder);
router.post('/:orderId/deliver', OrderWorkflowController.deliverOrder);
router.post(
    '/:orderId/customer-confirm',
    OrderWorkflowController.customerConfirmOrder,
);
router.post(
    '/:orderId/complete-cod',
    OrderWorkflowController.completeCODPayment,
);
router.post('/:orderId/return', OrderWorkflowController.returnOrder);
router.post('/:orderId/cancel', OrderWorkflowController.cancelOrder);

module.exports = router;
