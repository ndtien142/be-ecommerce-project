'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const productController = require('../../controllers/product.controller');
const { authenticationV2 } = require('../../auth/authUtils');
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
 *   parameters:
 *     userId:
 *       in: header
 *       name: x-user-id
 *       required: true
 *       schema:
 *         type: string
 *       description: User ID for authentication
 *     RefreshTokenHeader:
 *       in: header
 *       name: x-rf-token
 *       required: false
 *       schema:
 *         type: string
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
 *     ProductMeta:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         metaKey:
 *           type: string
 *         metaValue:
 *           type: string
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
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
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         meta:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductMeta'
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         minStock:
 *           type: integer
 *         weight:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         length:
 *           type: number
 *         code:
 *           type: string
 *         priceSale:
 *           type: number
 *         totalRating:
 *           type: integer
 *         totalReview:
 *           type: integer
 *         sold:
 *           type: integer
 *         inventoryType:
 *           type: string
 *         gender:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *         categories:
 *           type: array
 *           items:
 *             type: object
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
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *         description:
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
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         minStock:
 *           type: integer
 *         weight:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         length:
 *           type: number
 *         code:
 *           type: string
 *         priceSale:
 *           type: number
 *         totalRating:
 *           type: integer
 *         totalReview:
 *           type: integer
 *         sold:
 *           type: integer
 *         inventoryType:
 *           type: string
 *         gender:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: integer
 *         meta:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductMeta'
 *         categories:
 *           type: array
 *           items:
 *             type: integer
 *     UpdateProductInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
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
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         minStock:
 *           type: integer
 *         weight:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         length:
 *           type: number
 *         code:
 *           type: string
 *         priceSale:
 *           type: number
 *         totalRating:
 *           type: integer
 *         totalReview:
 *           type: integer
 *         sold:
 *           type: integer
 *         inventoryType:
 *           type: string
 *         gender:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: integer
 *         meta:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductMeta'
 *         categories:
 *           type: array
 *           items:
 *             type: integer
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
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
 *       - $ref: '#/components/parameters/userId'
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
 *       - $ref: '#/components/parameters/userId'
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
 *       - $ref: '#/components/parameters/userId'
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
 *       - $ref: '#/components/parameters/userId'
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
router.get('', asyncHandler(productController.getAllProducts));
router.get('/:id', asyncHandler(productController.getProductById));
router.get('/slug/:slug', asyncHandler(productController.getProductBySlug));

router.use(authenticationV2);

router.post('', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

module.exports = router;
