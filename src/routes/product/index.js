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
 *     summary: Get all products with optional filters
 *     tags: [Product]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: categorySlug
 *         schema:
 *           type: string
 *         description: Filter by category slug (includes child categories)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived, draft]
 *           default: active
 *         description: Filter by product status
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *         description: Filter by brand ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: flag
 *         schema:
 *           type: string
 *           enum: [new, popular, featured, none, on_sale]
 *         description: Filter by product flag
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: create_time
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products with filters applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 category:
 *                   type: object
 *                   description: Category information (when filtered by category)
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     status:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *                     imageUrl:
 *                       type: string
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
 *                     filters:
 *                       type: object
 *                       description: Applied filters for reference
 *                     includedCategoryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Category IDs included in filter (when filtering by category)
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
router.get('/slug/:slug', asyncHandler(productController.getProductBySlug));
router.get('/:id', asyncHandler(productController.getProductById));

router.use(authenticationV2);

router.post('', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

module.exports = router;
