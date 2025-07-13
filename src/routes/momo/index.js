'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const momoController = require('../../controllers/momo.controller');
const { authenticationV2 } = require('../../auth/authUtils');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MoMo Payment
 *   description: MoMo payment management
 */

// Public routes (no authentication required)
/**
 * @swagger
 * /momo/return:
 *   get:
 *     summary: Handle MoMo return URL
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
 *     responses:
 *       302:
 *         description: Redirect to frontend
 */
router.get('/return', asyncHandler(momoController.handleReturn));

/**
 * @swagger
 * /momo/ipn:
 *   post:
 *     summary: Handle MoMo IPN (Instant Payment Notification)
 *     tags: [MoMo Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: IPN processed successfully
 */
router.post('/ipn', asyncHandler(momoController.handleIPN));

// Protected routes (authentication required)
router.use(authenticationV2);

/**
 * @swagger
 * /momo/create-payment:
 *   post:
 *     summary: Create MoMo payment
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
 *                 description: Order ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               orderInfo:
 *                 type: string
 *                 description: Order information
 *               extraData:
 *                 type: string
 *                 description: Extra data
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Bad request
 */
router.post('/create-payment', asyncHandler(momoController.createPayment));

/**
 * @swagger
 * /momo/status/{orderId}:
 *   get:
 *     summary: Get payment status
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
router.get('/status/:orderId', asyncHandler(momoController.getPaymentStatus));

/**
 * @swagger
 * /momo/verify-signature:
 *   post:
 *     summary: Verify MoMo signature (for testing)
 *     tags: [MoMo Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Signature verification result
 */
router.post('/verify-signature', asyncHandler(momoController.verifySignature));


// Payment expiration management routes
/**
 * @swagger
 * /momo/expiration/{orderId}:
 *   get:
 *     summary: Get payment expiration status
 *     tags: [MoMo Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment expiration status retrieved successfully
 */
router.get('/expiration/:orderId', authenticationV2, asyncHandler(momoController.getPaymentExpirationStatus));

/**
 * @swagger
 * /momo/check-expired:
 *   post:
 *     summary: Check and process expired payments (Admin only)
 *     tags: [MoMo Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired payments processed successfully
 */
router.post('/check-expired', authenticationV2, asyncHandler(momoController.checkExpiredPayments));

/**
 * @swagger
 * /momo/cancel/{orderId}:
 *   post:
 *     summary: Cancel pending payment
 *     tags: [MoMo Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *                 example: "User requested cancellation"
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 */
router.post('/cancel/:orderId', authenticationV2, asyncHandler(momoController.cancelPayment));

module.exports = router;
