'use strict';

const express = require('express');
const orderController = require('../../controllers/order.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Order management
 */

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cart
 *               - addressId
 *               - paymentMethodId
 *               - shippingMethodId
 *             properties:
 *               cart:
 *                 type: object
 *                 description: Cart object with lineItems
 *               addressId:
 *                 type: integer
 *               paymentMethodId:
 *                 type: integer
 *               shippingMethodId:
 *                 type: integer
 *               note:
 *                 type: string
 *               shippingFee:
 *                 type: number
 *               trackingNumber:
 *                 type: string
 *               shippedBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /order/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /order/user:
 *   get:
 *     summary: Get orders by authenticated user
 *     tags: [Order]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_confirmation, pending_pickup, shipping, delivered, returned, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders from this date (ordered_date >=)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders up to this date (ordered_date <=)
 *     responses:
 *       200:
 *         description: List of orders
 */

/**
 * @swagger
 * /order/user/{id}:
 *   get:
 *     summary: Get order by ID for authenticated user
 *     tags: [Order]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details for user
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /order/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending_confirmation, pending_pickup, shipping, delivered, returned, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /order/{id}/cancel:
 *   patch:
 *     summary: Cancel order
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /order/{id}/address:
 *   patch:
 *     summary: Update order address (if not shipping)
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *             properties:
 *               addressId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order address updated successfully
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /order/user/count-by-status:
 *   get:
 *     summary: Get count of orders by each status for authenticated user
 *     tags: [Order]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Count of orders by status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending_confirmation:
 *                   type: integer
 *                 pending_pickup:
 *                   type: integer
 *                 shipping:
 *                   type: integer
 *                 delivered:
 *                   type: integer
 *                 returned:
 *                   type: integer
 *                 cancelled:
 *                   type: integer
 */

/**
 * @swagger
 * /order/admin/count-by-status:
 *   get:
 *     summary: Get count of orders by each status for admin (all users)
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Count of orders by status for admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending_confirmation:
 *                   type: integer
 *                 pending_pickup:
 *                   type: integer
 *                 shipping:
 *                   type: integer
 *                 delivered:
 *                   type: integer
 *                 returned:
 *                   type: integer
 *                 cancelled:
 *                   type: integer
 */

router.use(authenticationV2);

// User routes
router.post('/', asyncHandler(orderController.createOrder));
router.post('/momo', asyncHandler(orderController.createOrderWithMoMo));
router.get('/user', asyncHandler(orderController.getOrdersByUser));
router.get(
    '/user/analytics/count-by-status',
    asyncHandler(orderController.countOrdersByStatus),
);
router.get('/user/:id', asyncHandler(orderController.getOrderByIdForUser));

// Admin routes
router.get(
    '/admin/count-by-status',
    asyncHandler(orderController.countOrdersByStatusForAdmin),
);
router.get('/admin', asyncHandler(orderController.getOrdersByAdmin));
router.get('/admin/:id', asyncHandler(orderController.getOrderById));

// DEPRECATED: Sử dụng /workflow/confirm thay thế
// router.patch('/admin/:id/status', asyncHandler(orderController.updateOrderStatus));

// DEPRECATED: Sử dụng /workflow/cancel thay thế
// router.patch('/admin/:id/cancel', asyncHandler(orderController.cancelOrder));

router.patch(
    '/user/:id/address',
    asyncHandler(orderController.updateOrderAddress),
);

// Add workflow routes
router.use('/workflow', require('./workflow'));

// Add logs routes
router.use('/logs', require('./logs'));

module.exports = router;
