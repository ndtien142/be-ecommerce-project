'use strict';

const CartService = require('../services/cart/cart.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class CartController {
    createCart = async (req, res, next) => {
        // Use userId from authenticationV2
        const userId = req.user.userId;
        new CREATED({
            message: 'Cart created successfully',
            metadata: await CartService.createCart({ ...req.body, userId }),
        }).send(res);
    };

    getCartById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await CartService.getCartById(req.params.id),
        }).send(res);
    };

    getCartsByUserId = async (req, res, next) => {
        // Use userId from authenticationV2
        const userId = req.user.userId;
        new SuccessResponse({
            metadata: await CartService.getCartsByUserId(userId, req.query),
        }).send(res);
    };

    updateCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cart updated successfully',
            metadata: await CartService.updateCart(req.params.id, req.body),
        }).send(res);
    };

    deleteCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cart deleted successfully',
            metadata: await CartService.deleteCart(req.params.id),
        }).send(res);
    };

    addToCart = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Item added to cart',
            metadata: await CartService.addToCart({ ...req.body, userId }),
        }).send(res);
    };

    minusItemQuantity = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Item quantity decreased',
            metadata: await CartService.minusItemQuantity({
                ...req.body,
                userId,
            }),
        }).send(res);
    };

    plusItemQuantity = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Item quantity increased',
            metadata: await CartService.plusItemQuantity({
                ...req.body,
                userId,
            }),
        }).send(res);
    };

    removeItemFromCart = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Item removed from cart',
            metadata: await CartService.removeItemFromCart({
                ...req.body,
                userId,
            }),
        }).send(res);
    };
}

module.exports = new CartController();
