'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const categoriesController = require('../../controllers/categories.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         slug:
 *           type: string
 *         parentId:
 *           type: integer
 *         status:
 *           type: string
 *         sortOrder:
 *           type: integer
 *         imageUrl:
 *           type: string
 *         parent:
 *           $ref: '#/components/schemas/Category'
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *     CreateCategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         slug:
 *           type: string
 *         parentId:
 *           type: integer
 *         status:
 *           type: string
 *         sortOrder:
 *           type: integer
 *         imageUrl:
 *           type: string
 *     UpdateCategoryInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         slug:
 *           type: string
 *         parentId:
 *           type: integer
 *         status:
 *           type: string
 *         sortOrder:
 *           type: integer
 *         imageUrl:
 *           type: string
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
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
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (set status to inactive)
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Get all categories as a tree
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       200:
 *         description: Category tree
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/reorder:
 *   put:
 *     summary: Reorder categories and update parent
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: The category to move
 *               newParentId:
 *                 type: integer
 *                 nullable: true
 *                 description: The new parent category ID (null for root)
 *               orderedSiblingIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of sibling category IDs in the desired order (including the moved category)
 *     responses:
 *       200:
 *         description: Category reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/reorder-all:
 *   put:
 *     summary: Reorder all categories and update parent/children relationships
 *     tags: [Category]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 parentId:
 *                   type: integer
 *                   nullable: true
 *                 sortOrder:
 *                   type: integer
 *                 children:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *             example:
 *               - id: 1
 *                 parentId: null
 *                 sortOrder: 0
 *                 children:
 *                   - id: 2
 *                     parentId: 1
 *                     sortOrder: 0
 *                     children: []
 *                   - id: 3
 *                     parentId: 1
 *                     sortOrder: 1
 *                     children: []
 *               - id: 4
 *                 parentId: null
 *                 sortOrder: 1
 *                 children: []
 *     responses:
 *       200:
 *         description: All categories reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// Category routes
router.get('/tree', asyncHandler(categoriesController.getCategoryTree));
router.get('/:id', asyncHandler(categoriesController.getCategoryById));
router.get('', asyncHandler(categoriesController.getAllCategories));

router.use(authenticationV2);

router.post('', asyncHandler(categoriesController.createCategory));
router.put('/reorder', asyncHandler(categoriesController.reorderCategory));
router.put('/:id', asyncHandler(categoriesController.updateCategory));
router.delete('/:id', asyncHandler(categoriesController.deleteCategory));
router.put(
    '/reorder-all',
    asyncHandler(categoriesController.reorderAllCategories),
);

module.exports = router;
