'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const categoriesController = require('../../controllers/categories.controller');
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
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
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

// Category routes
router.post('', asyncHandler(categoriesController.createCategory));
router.get('', asyncHandler(categoriesController.getAllCategories));
router.get('/:id', asyncHandler(categoriesController.getCategoryById));
router.put('/:id', asyncHandler(categoriesController.updateCategory));
router.delete('/:id', asyncHandler(categoriesController.deleteCategory));

module.exports = router;
