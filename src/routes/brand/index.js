'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandler');
const brandController = require('../../controllers/brand.controler');
const router = express.Router();

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
 *     CreateBrandInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         logoUrl:
 *           type: string
 *         status:
 *           type: string
 *     UpdateBrandInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         logoUrl:
 *           type: string
 *         status:
 *           type: string
 */

/**
 * @swagger
 * /brand:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brand]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBrandInput'
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 */

/**
 * @swagger
 * /brand:
 *   get:
 *     summary: Get all brands
 *     tags: [Brand]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
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
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
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
 * /brand/{id}:
 *   get:
 *     summary: Get brand by ID
 *     tags: [Brand]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 */

/**
 * @swagger
 * /brand/{id}:
 *   put:
 *     summary: Update a brand
 *     tags: [Brand]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
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
 *             $ref: '#/components/schemas/UpdateBrandInput'
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 */

/**
 * @swagger
 * /brand/{id}:
 *   delete:
 *     summary: Delete a brand (set status to inactive)
 *     tags: [Brand]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// Brand routes
router.post('', asyncHandler(brandController.createBrand));
router.get('', asyncHandler(brandController.getAllBrands));
router.get('/:id', asyncHandler(brandController.getBrandById));
router.put('/:id', asyncHandler(brandController.updateBrand));
router.delete('/:id', asyncHandler(brandController.deleteBrand));

module.exports = router;
