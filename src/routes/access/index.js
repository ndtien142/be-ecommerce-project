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
 * /auth/signup:
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
 * /auth/login:
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
 * /auth/logout:
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
 * /auth/refresh-token:
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
 * /auth/refresh-token:
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
 * /auth/change-password:
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

/**
 * @swagger
 * /auth/verify-email-code:
 *   post:
 *     summary: Verify user email with 6-digit code
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - email
 *             properties:
 *               code:
 *                 type: string
 *                 description: 6-digit verification code
 *                 example: "123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: number
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *       400:
 *         description: Invalid or expired code, or email already verified
 */

/**
 * @swagger
 * /auth/resend-verification-code:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email to resend verification code
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 emailSent:
 *                   type: boolean
 *       400:
 *         description: Email already verified or failed to send email
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/check-verification-status:
 *   post:
 *     summary: Check email verification status
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email to check status
 *     responses:
 *       200:
 *         description: Email verification status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 emailVerified:
 *                   type: boolean
 *                 hasCode:
 *                   type: boolean
 *                 codeExpired:
 *                   type: boolean
 *       404:
 *         description: User not found
 */

router.post('/signup', asyncHandler(accessController.signUp));
router.post('/login', asyncHandler(accessController.login));
router.post(
    '/customer/signup',
    asyncHandler(accessController.signUpForCustomer),
);

// Email verification routes (public)
router.post(
    '/verify-email-code',
    asyncHandler(accessController.verifyEmailWithCode),
);
router.post(
    '/resend-verification-code',
    asyncHandler(accessController.resendVerificationCode),
);
router.post(
    '/check-verification-status',
    asyncHandler(accessController.checkEmailVerificationStatus),
);

router.use(authenticationV2);

router.post('/logout', asyncHandler(accessController.logout));
router.post('/refresh-token', asyncHandler(accessController.refreshToken));
router.put('/change-password', asyncHandler(accessController.changePassword));

module.exports = router;
