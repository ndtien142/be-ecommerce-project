'use strict';

const CartService = require('../services/cart/cart.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class CartController {
    createCart = async (req, res, next) => {
        // Use userId from authenticationV2
        const userId = req.user.userId;
        new CREATED({
            message: 'Tạo giỏ hàng thành công',
            metadata: await CartService.createCart({ ...req.body, userId }),
        }).send(res);
    };

    getCartById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await CartService.getCartById(req.params.id),
        }).send(res);
    };

    getCartsByUserId = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            metadata: await CartService.getCartsByUserId(userId),
        }).send(res);
    };

    updateCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật giỏ hàng thành công',
            metadata: await CartService.updateCart(req.params.id, req.body),
        }).send(res);
    };

    deleteCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Xóa giỏ hàng thành công',
            metadata: await CartService.deleteCart(req.params.id),
        }).send(res);
    };

    addToCart = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Thêm sản phẩm vào giỏ hàng thành công',
            metadata: await CartService.addToCart({ ...req.body, userId }),
        }).send(res);
    };

    minusItemQuantity = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Giảm số lượng sản phẩm thành công',
            metadata: await CartService.minusItemQuantity({
                ...req.body,
                userId,
            }),
        }).send(res);
    };

    plusItemQuantity = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Tăng số lượng sản phẩm thành công',
            metadata: await CartService.plusItemQuantity({
                ...req.body,
                userId,
            }),
        }).send(res);
    };

    removeItemFromCart = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
            metadata: await CartService.removeItemFromCart({
                ...req.body,
                userId,
            }),
        }).send(res);
    };

    countCartItems = async (req, res, next) => {
        const userId = req.user.userId;
        new SuccessResponse({
            message: 'Đếm số lượng sản phẩm trong giỏ hàng',
            metadata: await CartService.countCartItems(userId),
        }).send(res);
    };
}

module.exports = new CartController();
