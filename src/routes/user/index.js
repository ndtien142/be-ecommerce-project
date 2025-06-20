'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const userController = require('../../controllers/user.controller');
const { authenticationV2 } = require('../../auth/authUtils');
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
 *         userCode:
 *           type: string
 *         username:
 *           type: string
 *         isActive:
 *           type: boolean
 *         isBlock:
 *           type: boolean
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         profiles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserProfile'
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - roleId
 *         - firstName
 *         - lastName
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
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
 *       required:
 *         - userCode
 *       properties:
 *         username:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         roleId:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         isBlock:
 *           type: boolean
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
 *       - $ref: '#/components/parameters/UserCodeHeader'
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
 *       - $ref: '#/components/parameters/UserCodeHeader'
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
 *       - $ref: '#/components/parameters/UserCodeHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       - $ref: '#/components/parameters/UserCodeHeader'
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
 *       - $ref: '#/components/parameters/UserCodeHeader'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User marked as deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userCode:
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
 *       - $ref: '#/components/parameters/UserCodeHeader'
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
 *                 userCode:
 *                   type: string
 *                 isBlock:
 *                   type: boolean
 */

router.get('', asyncHandler(userController.getAllUsers));
router.get('/:id', asyncHandler(userController.getUserById));
router.post('', asyncHandler(userController.createUser));
router.put('/:id', asyncHandler(userController.updateUser));
router.patch('/:id/delete', asyncHandler(userController.markUserAsDeleted));
router.patch('/:id/block', asyncHandler(userController.markUserAsBlocked));

module.exports = router;
