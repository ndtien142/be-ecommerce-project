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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of orders
 */

/**
 * @swagger
 * /order/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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

router.use(authenticationV2);

router.post('/', asyncHandler(orderController.createOrder));
router.get('/user', asyncHandler(orderController.getOrdersByUser));
router.get('/:id', asyncHandler(orderController.getOrderById));
router.patch('/:id/status', asyncHandler(orderController.updateOrderStatus));
router.patch('/:id/cancel', asyncHandler(orderController.cancelOrder));
router.patch('/:id/address', asyncHandler(orderController.updateOrderAddress));

module.exports = router;
