'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const productController = require('../../controllers/product.controller');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         imageUrl:
 *           type: string
 *         isPrimary:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *     SKU:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         skuCode:
 *           type: string
 *         skuName:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         minStock:
 *           type: integer
 *         status:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *     Brand:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         logoUrl:
 *           type: string
 *         status:
 *           type: string
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         productType:
 *           type: string
 *         thumbnail:
 *           type: string
 *         slug:
 *           type: string
 *         status:
 *           type: string
 *         brand:
 *           $ref: '#/components/schemas/Brand'
 *         skus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SKU'
 *         createTime:
 *           type: string
 *           format: date-time
 *         updateTime:
 *           type: string
 *           format: date-time
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - name
 *         - productType
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         productType:
 *           type: string
 *           enum: [simple, product_variants]
 *         thumbnail:
 *           type: string
 *         slug:
 *           type: string
 *         status:
 *           type: string
 *         brandId:
 *           type: integer
 *         brand:
 *           $ref: '#/components/schemas/Brand'
 *         skus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SKU'
 *     UpdateProductInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         productType:
 *           type: string
 *         thumbnail:
 *           type: string
 *         slug:
 *           type: string
 *         status:
 *           type: string
 *         brandId:
 *           type: integer
 *         brand:
 *           $ref: '#/components/schemas/Brand'
 *         skus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SKU'
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 rows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /product/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details by slug
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
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
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// Product routes
router.post('', asyncHandler(productController.createProduct));
router.get('', asyncHandler(productController.getAllProducts));
router.get('/:id', asyncHandler(productController.getProductById));
router.get('/slug/:slug', asyncHandler(productController.getProductBySlug));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

module.exports = router;
