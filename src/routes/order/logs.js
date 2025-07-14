'use strict';

const express = require('express');
const router = express.Router();
const OrderLogController = require('../../controllers/orderLog.controller');
const { authenticationV2 } = require('../../auth/authUtils');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         orderId:
 *           type: integer
 *         fromStatus:
 *           type: string
 *           enum: [pending_confirmation, pending_pickup, shipping, delivered, customer_confirmed, returned, cancelled]
 *         toStatus:
 *           type: string
 *           enum: [pending_confirmation, pending_pickup, shipping, delivered, customer_confirmed, returned, cancelled]
 *         action:
 *           type: string
 *           enum: [created, confirmed, picked_up, shipped, delivered, customer_confirmed, returned, cancelled, cod_completed, payment_completed, refunded]
 *         actorType:
 *           type: string
 *           enum: [system, admin, customer, shipper, payment_gateway]
 *         actorId:
 *           type: integer
 *         actorName:
 *           type: string
 *         note:
 *           type: string
 *         metadata:
 *           type: object
 *         ipAddress:
 *           type: string
 *         userAgent:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     OrderTimelineItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         orderId:
 *           type: integer
 *         fromStatus:
 *           type: string
 *         toStatus:
 *           type: string
 *         action:
 *           type: string
 *         actorType:
 *           type: string
 *         actorName:
 *           type: string
 *         note:
 *           type: string
 *         icon:
 *           type: string
 *           description: Icon cho UI
 *         color:
 *           type: string
 *           description: Color cho UI
 *         title:
 *           type: string
 *           description: Title cho UI
 *         description:
 *           type: string
 *           description: Description cho UI
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/order/logs/{orderId}:
 *   get:
 *     summary: Lấy lịch sử log của đơn hàng
 *     tags: [Order Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số lượng log tối đa
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Bỏ qua số lượng log
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
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
 *                   example: Lấy lịch sử đơn hàng thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderLog'
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/logs/{orderId}/timeline:
 *   get:
 *     summary: Lấy timeline của đơn hàng (dạng đẹp cho UI)
 *     tags: [Order Logs]
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
 *         description: Lấy timeline thành công
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
 *                   example: Lấy timeline đơn hàng thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timeline:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderTimelineItem'
 *       404:
 *         description: Đơn hàng không tồn tại
 */

/**
 * @swagger
 * /api/v1/order/logs/action/{action}:
 *   get:
 *     summary: Lấy log theo action
 *     tags: [Order Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [created, confirmed, picked_up, shipped, delivered, customer_confirmed, returned, cancelled, cod_completed, payment_completed, refunded]
 *         description: Loại action cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Số lượng log tối đa
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Bỏ qua số lượng log
 *     responses:
 *       200:
 *         description: Lấy log theo action thành công
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
 *                   example: Lấy log theo hành động thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderLog'
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */

/**
 * @swagger
 * /api/v1/order/logs/stats/actor:
 *   get:
 *     summary: Lấy thống kê log theo actor
 *     tags: [Order Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
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
 *                   example: Lấy thống kê log theo actor thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           actorType:
 *                             type: string
 *                           action:
 *                             type: string
 *                           count:
 *                             type: integer
 */

/**
 * @swagger
 * /api/v1/order/logs/dashboard:
 *   get:
 *     summary: Lấy dashboard statistics
 *     tags: [Order Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lấy thống kê dashboard thành công
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
 *                   example: Lấy thống kê dashboard thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     actionStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     actorStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           actorType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 */

/**
 * @swagger
 * /api/v1/order/logs/pending-confirmation:
 *   get:
 *     summary: Lấy các đơn hàng cần xác nhận từ khách hàng
 *     tags: [Order Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số lượng đơn hàng tối đa
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Bỏ qua số lượng đơn hàng
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                   example: Lấy danh sách đơn hàng chờ xác nhận thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           deliveredDate:
 *                             type: string
 *                             format: date-time
 *                           userId:
 *                             type: integer
 *                           totalAmount:
 *                             type: number
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */

/**
 * @swagger
 * /api/v1/order/logs/admin/all:
 *   get:
 *     summary: Admin xem tất cả logs (có phân trang và filter)
 *     tags: [Order Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Số lượng log tối đa
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Bỏ qua số lượng log
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, confirmed, picked_up, shipped, delivered, customer_confirmed, returned, cancelled, cod_completed, payment_completed, refunded]
 *         description: Lọc theo action
 *       - in: query
 *         name: actorType
 *         schema:
 *           type: string
 *           enum: [system, admin, customer, shipper, payment_gateway]
 *         description: Lọc theo actor type
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: integer
 *         description: Lọc theo order ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lấy tất cả logs thành công
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
 *                   example: Lấy tất cả logs thành công
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           orderId:
 *                             type: integer
 *                           fromStatus:
 *                             type: string
 *                           toStatus:
 *                             type: string
 *                           action:
 *                             type: string
 *                           actorType:
 *                             type: string
 *                           actorName:
 *                             type: string
 *                           note:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           order:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               status:
 *                                 type: string
 *                               totalAmount:
 *                                 type: number
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */

router.use(authenticationV2);

router.get('/dashboard', OrderLogController.getDashboardStats);
router.get(
    '/pending-confirmation',
    OrderLogController.getPendingConfirmationOrders,
);
router.get('/admin/all', OrderLogController.getAllLogsForAdmin);
router.get('/stats/actor', OrderLogController.getLogStatsByActor);
router.get('/action/:action', OrderLogController.getLogsByAction);

router.get('/:orderId/timeline', OrderLogController.getOrderTimeline);

router.get('/:orderId', OrderLogController.getOrderLogs);

module.exports = router;
