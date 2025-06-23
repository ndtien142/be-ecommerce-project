'use strict';

const express = require('express');
const cartController = require('../../controllers/cart.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: API for cart management
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     UserIdHeader:
 *       in: header
 *       name: x-user-id
 *       required: true
 *       schema:
 *         type: string
 *       description: User ID from authentication
 */

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Create a new cart
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, ordered]
 *               totalAmount:
 *                 type: number
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *                     total:
 *                       type: number
 *     responses:
 *       201:
 *         description: Cart created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /cart/{id}:
 *   get:
 *     summary: Get cart by ID
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: Cart details
 *       404:
 *         description: Cart not found
 */

/**
 * @swagger
 * /cart/user:
 *   get:
 *     summary: Get carts by authenticated user
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of carts
 */

/**
 * @swagger
 * /cart/{id}:
 *   put:
 *     summary: Update cart by ID
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *                     total:
 *                       type: number
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       404:
 *         description: Cart not found
 */

/**
 * @swagger
 * /cart/{id}:
 *   delete:
 *     summary: Delete cart by ID (set status to inactive)
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: Cart set to inactive successfully
 *       404:
 *         description: Cart not found
 */

/**
 * @swagger
 * /cart/add:
 *   patch:
 *     summary: Add item to cart (create or update cart)
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - price
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item added to cart
 */

/**
 * @swagger
 * /cart/minus:
 *   patch:
 *     summary: Minus quantity of item in cart
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item quantity decreased
 */

/**
 * @swagger
 * /cart/plus:
 *   patch:
 *     summary: Plus quantity of item in cart
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item quantity increased
 */

/**
 * @swagger
 * /cart/remove:
 *   patch:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item removed from cart
 */

router.use(authenticationV2);

router.post('/', asyncHandler(cartController.createCart));
// router.get('/:id', asyncHandler(cartController.getCartById));
router.get('/user', asyncHandler(cartController.getCartsByUserId));
router.put('/:id', asyncHandler(cartController.updateCart));
router.delete('/:id', asyncHandler(cartController.deleteCart));

// Cart item operations
router.patch('/add', asyncHandler(cartController.addToCart));
router.patch('/minus', asyncHandler(cartController.minusItemQuantity));
router.patch('/plus', asyncHandler(cartController.plusItemQuantity));
router.patch('/remove', asyncHandler(cartController.removeItemFromCart));

module.exports = router;
