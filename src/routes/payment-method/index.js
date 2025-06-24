'use strict';

const express = require('express');
const paymentMethodController = require('../../controllers/paymentMethod.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PaymentMethod
 *   description: Payment method management
 */

/**
 * @swagger
 * /payment-method:
 *   post:
 *     summary: Create a new payment method
 *     tags: [PaymentMethod]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - provider
 *             properties:
 *               name:
 *                 type: string
 *               provider:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /payment-method:
 *   get:
 *     summary: Get all payment methods
 *     tags: [PaymentMethod]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of payment methods
 */

/**
 * @swagger
 * /payment-method/{id}:
 *   get:
 *     summary: Get payment method by ID
 *     tags: [PaymentMethod]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method details
 *       404:
 *         description: Payment method not found
 */

/**
 * @swagger
 * /payment-method/{id}:
 *   put:
 *     summary: Update payment method by ID
 *     tags: [PaymentMethod]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment method ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       404:
 *         description: Payment method not found
 */

/**
 * @swagger
 * /payment-method/{id}/status:
 *   patch:
 *     summary: Change payment method status (active/inactive)
 *     tags: [PaymentMethod]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment method ID
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
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Payment method status updated successfully
 *       404:
 *         description: Payment method not found
 */

router.get('/', asyncHandler(paymentMethodController.getAllPaymentMethods));
router.get('/:id', asyncHandler(paymentMethodController.getPaymentMethodById));

router.use(authenticationV2);

router.post('/', asyncHandler(paymentMethodController.createPaymentMethod));
router.put('/:id', asyncHandler(paymentMethodController.updatePaymentMethod));
router.patch('/:id/status', asyncHandler(paymentMethodController.changeStatus));

module.exports = router;
