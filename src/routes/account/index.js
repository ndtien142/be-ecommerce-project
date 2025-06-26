'use strict';

const express = require('express');
const accountController = require('../../controllers/account.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: User account/profile management
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
 * /account/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Account]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: User profile data
 *       404:
 *         description: Profile not found
 */

/**
 * @swagger
 * /account/profile:
 *   put:
 *     summary: Update user profile (creates if not exists)
 *     tags: [Account]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               bio:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Profile updated or created
 *       400:
 *         description: Bad request
 */

router.use(authenticationV2);

router.get('/profile', asyncHandler(accountController.getProfile));
router.put('/profile', asyncHandler(accountController.updateProfile));

module.exports = router;
