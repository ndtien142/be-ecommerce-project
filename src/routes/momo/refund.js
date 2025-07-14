'use strict';

const express = require('express');
const momoRefundController = require('../../controllers/momoRefund.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const checkRole = require('../../middleware/checkRole');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MoMo Refund
 *   description: MoMo payment refund management
 */

/**
 * @swagger
 * /api/v1/momo/refund/full:
 *   post:
 *     summary: Process full refund for an order
 *     tags: [MoMo Refund]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Original order ID to refund
 *                 example: "123"
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *                 example: "Customer requested return"
 *     responses:
 *       200:
 *         description: Full refund processed successfully
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
 *                     success:
 *                       type: boolean
 *                     refundOrderId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     resultCode:
 *                       type: integer
 *                     message:
 *                       type: string
 */
router.post('/full', authenticationV2, momoRefundController.createFullRefund);

/**
 * @swagger
 * /api/v1/momo/refund/partial:
 *   post:
 *     summary: Process partial refund for an order
 *     tags: [MoMo Refund]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Original order ID to refund
 *                 example: "123"
 *               amount:
 *                 type: number
 *                 description: Amount to refund
 *                 example: 50000
 *               reason:
 *                 type: string
 *                 description: Reason for partial refund
 *                 example: "Damaged item return"
 *               items:
 *                 type: array
 *                 description: Items to refund (for itemized refunds)
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     productId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Partial refund processed successfully
 */
router.post(
    '/partial',
    authenticationV2,
    momoRefundController.createPartialRefund,
);

/**
 * @swagger
 * /api/v1/momo/refund/manual:
 *   post:
 *     summary: Create manual refund with custom parameters
 *     tags: [MoMo Refund]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalOrderId
 *               - refundOrderId
 *               - amount
 *               - transId
 *             properties:
 *               originalOrderId:
 *                 type: string
 *                 description: Original order ID
 *               refundOrderId:
 *                 type: string
 *                 description: New refund order ID
 *               amount:
 *                 type: number
 *                 description: Refund amount
 *               transId:
 *                 type: string
 *                 description: Original MoMo transaction ID
 *               description:
 *                 type: string
 *                 description: Refund description
 *               transGroup:
 *                 type: array
 *                 description: Itemized refund details
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     transId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Manual refund created successfully
 */
router.post(
    '/manual',
    authenticationV2,
    checkRole(['admin', 'manager']),
    momoRefundController.createManualRefund,
);

/**
 * @swagger
 * /api/v1/momo/refund/status/{refundOrderId}/{requestId}:
 *   get:
 *     summary: Query refund status from MoMo
 *     tags: [MoMo Refund]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundOrderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Refund order ID
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Refund request ID
 *     responses:
 *       200:
 *         description: Refund status retrieved successfully
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
 *                     success:
 *                       type: boolean
 *                     resultCode:
 *                       type: integer
 *                     message:
 *                       type: string
 *                     refundTrans:
 *                       type: array
 *                     items:
 *                       type: array
 */
router.get(
    '/status/:refundOrderId/:requestId',
    authenticationV2,
    momoRefundController.queryRefundStatus,
);

/**
 * @swagger
 * /api/v1/momo/refund/history/{orderId}:
 *   get:
 *     summary: Get refund history for an order
 *     tags: [MoMo Refund]
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
 *         description: Refund history retrieved successfully
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
 *                     orderId:
 *                       type: string
 *                     refunds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           amount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           transactionId:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                     totalRefunds:
 *                       type: integer
 *                     totalRefundedAmount:
 *                       type: number
 */
router.get(
    '/history/:orderId',
    authenticationV2,
    momoRefundController.getRefundHistory,
);

/**
 * @swagger
 * /api/v1/momo/refund/total/{orderId}:
 *   get:
 *     summary: Get total refunded amount for an order
 *     tags: [MoMo Refund]
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
 *         description: Total refunded amount retrieved successfully
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
 *                     orderId:
 *                       type: string
 *                     totalRefunded:
 *                       type: number
 */
router.get(
    '/total/:orderId',
    authenticationV2,
    momoRefundController.getTotalRefunded,
);

module.exports = router;
