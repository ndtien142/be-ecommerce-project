'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const userController = require('../../controllers/user.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const checkRole = require('../../middleware/checkRole');
const router = express.Router();

router.use(authenticationV2);

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         address:
 *           type: string
 *         create_time:
 *           type: string
 *           format: date-time
 *     UserRole:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         userStatus:
 *           type: string
 *           enum: [normal, pending, blocked, deleted, suspended]
 *         emailVerified:
 *           type: boolean
 *         userRegistered:
 *           type: string
 *           format: date-time
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         profile:
 *           $ref: '#/components/schemas/UserProfile'
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - email
 *         - roleId
 *         - firstName
 *         - lastName
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         avatarUrl:
 *           type: string
 *         roleId:
 *           type: integer
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         address:
 *           type: string
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         avatarUrl:
 *           type: string
 *         roleId:
 *           type: integer
 *         userStatus:
 *           type: string
 *           enum: [normal, pending, blocked, deleted, suspended]
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         address:
 *           type: string
 */

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     itemPerPage:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /user/{id}/delete:
 *   patch:
 *     summary: Mark user as deleted
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User marked as deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 userStatus:
 *                   type: string
 *               properties:
 *                 userId:
 *                   type: string
 *                 isDeleted:
 *                   type: boolean
 */

/**
 * @swagger
 * /user/{id}/block:
 *   patch:
 *     summary: Update user block status
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isBlock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User block status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 userStatus:
 *                   type: string
 *                 isBlocked:
 *                   type: boolean
 */

/**
 * @swagger
 * /user/admin:
 *   post:
 *     summary: Create admin user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get current user profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update current user profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

// User profile routes - user có thể xem và cập nhật profile của mình
router.get('/profile', asyncHandler(userController.getCurrentUserProfile));
router.put('/profile', asyncHandler(userController.updateCurrentUserProfile));

// Admin only routes - quản lý user
router.get('', checkRole(['admin']), asyncHandler(userController.getAllUsers));
router.post('', checkRole(['admin']), asyncHandler(userController.createUser));
router.post(
    '/admin',
    checkRole(['admin']),
    asyncHandler(userController.createAdmin),
);
router.put(
    '/:id',
    checkRole(['admin']),
    asyncHandler(userController.updateUser),
);
router.patch(
    '/:id/delete',
    checkRole(['admin']),
    asyncHandler(userController.markUserAsDeleted),
);
router.patch(
    '/:id/block',
    checkRole(['admin']),
    asyncHandler(userController.markUserAsBlocked),
);

// User can view their own profile, admin can view any user
router.get('/:id', asyncHandler(userController.getUserById));

module.exports = router;
