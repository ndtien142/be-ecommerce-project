'use strict';

const express = require('express');
const addressController = require('../../controllers/address.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Address
 *   description: User address management
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     UserIdHeader:
 *       in: header
 *       name: x-user-id
 *       required: true
 *       schema:
 *         type: string
 *       description: User ID
 */

/**
 * @swagger
 * /address:
 *   post:
 *     summary: Create a new address
 *     tags: [Address]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - country
 *               - city
 *               - street
 *               - receiverName
 *               - phoneNumber
 *             properties:
 *               title:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               ward:
 *                 type: string
 *               street:
 *                 type: string
 *               streetNumber:
 *                 type: string
 *               receiverName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /address/user:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Address]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: List of addresses
 */

/**
 * @swagger
 * /address/{id}:
 *   get:
 *     summary: Get address by ID
 *     tags: [Address]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address details
 *       404:
 *         description: Address not found
 */

/**
 * @swagger
 * /address/{id}:
 *   put:
 *     summary: Update address by ID
 *     tags: [Address]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */

/**
 * @swagger
 * /address/{id}:
 *   delete:
 *     summary: Delete address by ID
 *     tags: [Address]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */

/**
 * @swagger
 * /address/set-default:
 *   post:
 *     summary: Set default address for user
 *     tags: [Address]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *         description: Default address set successfully
 *       404:
 *         description: Address not found
 */

router.use(authenticationV2);

router.post('/', asyncHandler(addressController.createAddress));
router.get('/user', asyncHandler(addressController.getAddressesByUser));
router.get('/:id', asyncHandler(addressController.getAddressById));
router.put('/:id', asyncHandler(addressController.updateAddress));
router.delete('/:id', asyncHandler(addressController.deleteAddress));
router.post('/set-default', asyncHandler(addressController.setDefaultAddress));

module.exports = router;
