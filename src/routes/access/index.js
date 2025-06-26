'use strict';

const express = require('express');
const accessController = require('../../controllers/access.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Access
 *   description: API for user access management
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: User signup (admin/staff)
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - roleName
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the account
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the account
 *               roleName:
 *                 type: string
 *                 description: Role name (e.g., admin, staff)
 *     responses:
 *       201:
 *         description: Signup successful
 *       400:
 *         description: Username already registered or role not found
 */
/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Account not active or blocked
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User logout
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User code of the logged-in account
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Invalid user code
 */
/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token previously issued
 *     responses:
 *       200:
 *         description: New token pair generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *       403:
 *         description: Refresh token has been used or is invalid
 *       404:
 *         description: Refresh token not found or expired
 */
/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token previously issued
 *     responses:
 *       200:
 *         description: New token pair generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *       403:
 *         description: Refresh token has been used or is invalid
 *       404:
 *         description: Refresh token not found or expired
 */
/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: userid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from authentication header
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Old password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Old password is incorrect or user not found
 */

router.post('/signup', asyncHandler(accessController.signUp));
router.post('/login', asyncHandler(accessController.login));
router.post(
    '/customer/signup',
    asyncHandler(accessController.signUpForCustomer),
);

router.use(authenticationV2);

router.post('/logout', asyncHandler(accessController.logout));
router.post('/refresh-token', asyncHandler(accessController.refreshToken));
router.put('/change-password', asyncHandler(accessController.changePassword));

module.exports = router;
