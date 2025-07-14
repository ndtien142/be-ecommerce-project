'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const momoController = require('../../controllers/momo.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MoMo Payment
 *   description: MoMo payment management - 4 main functions
 */

// ===============================
// MAIN FUNCTION 1: CREATE PAYMENT
// ===============================
/**
 * @swagger
 * /momo/create:
 *   post:
 *     summary: Create MoMo payment and update cart status
 *     tags: [MoMo Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID (will be used as both orderId and requestId)
 *               amount:
 *                 type: number
 *                 description: Payment amount (1,000 - 50,000,000 VND)
 *               orderInfo:
 *                 type: string
 *                 description: Order information
 *               extraData:
 *                 type: string
 *                 description: Extra data (optional)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *               deliveryInfo:
 *                 type: object
 *                 properties:
 *                   deliveryAddress:
 *                     type: string
 *                   deliveryFee:
 *                     type: string
 *                   quantity:
 *                     type: string
 *               userInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   email:
 *                     type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Bad request
 */
router.post('/create', asyncHandler(momoController.createPayment));

// ===============================
// MAIN FUNCTION 2: IPN CALLBACK
// ===============================
/**
 * @swagger
 * /momo/ipn:
 *   post:
 *     summary: Handle MoMo IPN callback to update order status
 *     tags: [MoMo Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               requestId:
 *                 type: string
 *               amount:
 *                 type: number
 *               resultCode:
 *                 type: integer
 *               message:
 *                 type: string
 *               transId:
 *                 type: number
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: IPN processed successfully
 *       400:
 *         description: Invalid signature or bad request
 */
router.post('/ipn', asyncHandler(momoController.handleIpn));

// ===============================
// MAIN FUNCTION 3: CHECK TRANSACTION STATUS
// ===============================
/**
 * @swagger
 * /momo/status/{orderId}:
 *   get:
 *     summary: Check transaction status and update order
 *     tags: [MoMo Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to check status
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Transaction not found
 */
router.get(
    '/status/:orderId',
    asyncHandler(momoController.checkTransactionStatus),
);

// ===============================
// MAIN FUNCTION 4: REFUND TRANSACTION
// ===============================
/**
 * @swagger
 * /momo/refund:
 *   post:
 *     summary: Refund complete transaction
 *     tags: [MoMo Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - transId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Original order ID
 *               transId:
 *                 type: number
 *                 description: MoMo transaction ID
 *               amount:
 *                 type: number
 *                 description: Refund amount
 *               description:
 *                 type: string
 *                 description: Refund description
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Bad request
 */
router.post('/refund', asyncHandler(momoController.refundTransaction));

// ===============================
// ADDITIONAL ROUTES
// ===============================
/**
 * @swagger
 * /momo/payment-status/{orderId}:
 *   get:
 *     summary: Get payment status by order ID
 *     tags: [MoMo Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get(
    '/payment-status/:orderId',
    asyncHandler(momoController.getPaymentStatus),
);

/**
 * @swagger
 * /momo/return:
 *   get:
 *     summary: Handle MoMo return URL (redirect from MoMo app/web)
 *     tags: [MoMo Payment]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: query
 *         name: resultCode
 *         schema:
 *           type: string
 *         description: Result code from MoMo
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *         description: Message from MoMo
 *     responses:
 *       302:
 *         description: Redirect to frontend
 */
router.get('/return', asyncHandler(momoController.handleReturn));

module.exports = router;
