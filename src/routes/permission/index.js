'use strict';

const express = require('express');
const permissionController = require('../../controllers/permission.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permission
 *   description: Permission management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         permissionName:
 *           type: string
 *         permissionDescription:
 *           type: string
 *         slug:
 *           type: string
 *     CreatePermissionInput:
 *       type: object
 *       required:
 *         - permissionName
 *         - permissionDescription
 *         - slug
 *       properties:
 *         permissionName:
 *           type: string
 *         permissionDescription:
 *           type: string
 *         slug:
 *           type: string
 *     UpdatePermissionInput:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *         permissionName:
 *           type: string
 *         permissionDescription:
 *           type: string
 *         slug:
 *           type: string
 */

/**
 * @swagger
 * /permission:
 *   post:
 *     summary: Create a new permission
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *     tags: [Permission]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionInput'
 *     responses:
 *       200:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permission'
 */

/**
 * @swagger
 * /permission:
 *   put:
 *     summary: Update a permission
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *     tags: [Permission]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePermissionInput'
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permission'
 */

/**
 * @swagger
 * /permission/{id}:
 *   delete:
 *     summary: Delete a permission
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [Permission]
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 */

/**
 * @swagger
 * /permission:
 *   get:
 *     summary: Get all permissions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     tags: [Permission]
 *     responses:
 *       200:
 *         description: List of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metadata:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
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
 * /permission/{id}:
 *   get:
 *     summary: Get permission by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     tags: [Permission]
 *     responses:
 *       200:
 *         description: Permission details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permission'
 */

router.post('', asyncHandler(permissionController.createPermission));
router.put('', asyncHandler(permissionController.updatePermission));
router.delete('/:id', asyncHandler(permissionController.deletePermission));
router.get('', asyncHandler(permissionController.getAllPermissions));
router.get('/:id', asyncHandler(permissionController.getPermissionById));

module.exports = router;
