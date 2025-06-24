'use strict';

const express = require('express');
const shippingMethodController = require('../../controllers/shippingMethod.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ShippingMethod
 *   description: Shipping method management
 */

/**
 * @swagger
 * /shipping-method:
 *   post:
 *     summary: Create a new shipping method
 *     tags: [ShippingMethod]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Shipping method created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /shipping-method:
 *   get:
 *     summary: Get all shipping methods
 *     tags: [ShippingMethod]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of shipping methods
 */

/**
 * @swagger
 * /shipping-method/{id}:
 *   get:
 *     summary: Get shipping method by ID
 *     tags: [ShippingMethod]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipping method ID
 *     responses:
 *       200:
 *         description: Shipping method details
 *       404:
 *         description: Shipping method not found
 */

/**
 * @swagger
 * /shipping-method/{id}:
 *   put:
 *     summary: Update shipping method by ID
 *     tags: [ShippingMethod]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipping method ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Shipping method updated successfully
 *       404:
 *         description: Shipping method not found
 */

/**
 * @swagger
 * /shipping-method/{id}/status:
 *   patch:
 *     summary: Change shipping method status (active/inactive)
 *     tags: [ShippingMethod]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipping method ID
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
 *         description: Shipping method status updated successfully
 *       404:
 *         description: Shipping method not found
 */

router.post('/', asyncHandler(shippingMethodController.createShippingMethod));
router.get('/', asyncHandler(shippingMethodController.getAllShippingMethods));
router.get(
    '/:id',
    asyncHandler(shippingMethodController.getShippingMethodById),
);
router.put('/:id', asyncHandler(shippingMethodController.updateShippingMethod));
router.patch(
    '/:id/status',
    asyncHandler(shippingMethodController.changeStatus),
);

module.exports = router;
