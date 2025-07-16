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
 *     summary: Create a new order with COD payment
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *                 properties:
 *                   lineItems:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: integer
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *               addressId:
 *                 type: integer
 *                 description: Shipping address ID
 *               paymentMethodId:
 *                 type: integer
 *                 description: Payment method ID (for COD)
 *               shippingMethodId:
 *                 type: integer
 *                 description: Shipping method ID
 *               note:
 *                 type: string
 *                 description: Optional order note
 *               shippingFee:
 *                 type: number
 *                 description: Shipping fee amount
 *                 default: 0
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [pending_confirmation]
 *                     totalAmount:
 *                       type: number
 *                     orderDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error or insufficient stock
 *       404:
 *         description: Product, address, or payment method not found
 */

/**
 * @swagger
 * /order/momo:
 *   post:
 *     summary: Create a new order with MoMo payment
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cart
 *               - addressId
 *               - shippingMethodId
 *             properties:
 *               cart:
 *                 type: object
 *                 description: Cart object with lineItems
 *                 properties:
 *                   lineItems:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: integer
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *               addressId:
 *                 type: integer
 *                 description: Shipping address ID
 *               shippingMethodId:
 *                 type: integer
 *                 description: Shipping method ID
 *               note:
 *                 type: string
 *                 description: Optional order note
 *               shippingFee:
 *                 type: number
 *                 description: Shipping fee amount
 *                 default: 0
 *     responses:
 *       201:
 *         description: Order created successfully with MoMo payment URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         userId:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [pending_confirmation]
 *                         totalAmount:
 *                           type: number
 *                     paymentUrl:
 *                       type: string
 *                       description: MoMo payment URL for user to complete payment
 *       400:
 *         description: Bad request - validation error or insufficient stock
 *       404:
 *         description: Product, address, or shipping method not found
 */

/**
 * @swagger
 * /order/admin:
 *   get:
 *     summary: Get all orders for admin with pagination and filters
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_confirmation, pending_pickup, shipping, delivered, customer_confirmed, returned, cancelled]
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
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, momo]
 *         description: Filter by payment method
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, refunded]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: List of orders with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           userId:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           orderDate:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               userLogin:
 *                                 type: string
 *                               userEmail:
 *                                 type: string
 *                           payment:
 *                             type: object
 *                             properties:
 *                               paymentMethod:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               amount:
 *                                 type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Bad request - invalid parameters
 */

/**
 * @swagger
 * /order/admin/{id}:
 *   get:
 *     summary: Get order by ID for admin (detailed view)
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Detailed order information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     orderDate:
 *                       type: string
 *                       format: date-time
 *                     note:
 *                       type: string
 *                     trackingNumber:
 *                       type: string
 *                     shippedBy:
 *                       type: string
 *                     user:
 *                       type: object
 *                     address:
 *                       type: object
 *                     payment:
 *                       type: object
 *                     shippingMethod:
 *                       type: object
 *                     lineItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                           total:
 *                             type: number
 *                           product:
 *                             type: object
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /order/user:
 *   get:
 *     summary: Get orders by authenticated user with pagination
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_confirmation, pending_pickup, shipping, delivered, customer_confirmed, returned, cancelled]
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
 *         description: List of user orders with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           totalAmount:
 *                             type: number
 *                           orderDate:
 *                             type: string
 *                             format: date-time
 *                           payment:
 *                             type: object
 *                             properties:
 *                               paymentMethod:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                           lineItems:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                     image:
 *                                       type: string
 *                                 quantity:
 *                                   type: integer
 *                                 price:
 *                                   type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Bad request - invalid parameters
 */

/**
 * @swagger
 * /order/user/{id}:
 *   get:
 *     summary: Get specific order by ID for authenticated user
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Detailed order information for user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     orderDate:
 *                       type: string
 *                       format: date-time
 *                     note:
 *                       type: string
 *                     trackingNumber:
 *                       type: string
 *                     shippedBy:
 *                       type: string
 *                     deliveredDate:
 *                       type: string
 *                       format: date-time
 *                     address:
 *                       type: object
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         addressLine:
 *                           type: string
 *                         city:
 *                           type: string
 *                         district:
 *                           type: string
 *                         ward:
 *                           type: string
 *                     payment:
 *                       type: object
 *                       properties:
 *                         paymentMethod:
 *                           type: string
 *                         status:
 *                           type: string
 *                         amount:
 *                           type: number
 *                     lineItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                           total:
 *                             type: number
 *                           product:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               image:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *       404:
 *         description: Order not found or user doesn't have permission
 *       403:
 *         description: Access denied - order doesn't belong to user
 */

/**
 * @swagger
 * /order/user/{id}/address:
 *   patch:
 *     summary: Update order shipping address (only if order is not yet shipped)
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *                 description: New shipping address ID
 *     responses:
 *       200:
 *         description: Order address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     addressId:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad request - order already shipped or invalid address
 *       404:
 *         description: Order or address not found
 */

/**
 * @swagger
 *   /order/user/analytics/count-by-status:
 *     get:
 *       summary: Get count of orders by each status for authenticated user
 *       tags: [Order]
 *       parameters:
 *         - $ref: '#/components/parameters/UserIdHeader'
 *       responses:
 *         200:
 *           description: Count of orders by status for user
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                   metadata:
 *                     type: object
 *                     properties:
 *                       pendingConfirmation:
 *                         type: integer
 *                       pendingPickup:
 *                         type: integer
 *                       shipping:
 *                         type: integer
 *                       delivered:
 *                         type: integer
 *                       customerConfirmed:
 *                         type: integer
 *                       returned:
 *                         type: integer
 *                       cancelled:
 *                         type: integer
 *         400:
 *           description: Bad request

/**
 * @swagger
 * /order/admin/count-by-status:
 *   get:
 *     summary: Get count of orders by each status for admin (all users)
 *     tags: [Order]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: Count of orders by status for admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     pendingConfirmation:
 *                       type: integer
 *                     pendingPickup:
 *                       type: integer
 *                     shipping:
 *                       type: integer
 *                     delivered:
 *                       type: integer
 *                     customerConfirmed:
 *                       type: integer
 *                     returned:
 *                       type: integer
 *                     cancelled:
 *                       type: integer
 *       403:
 *         description: Access denied - admin role required
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
