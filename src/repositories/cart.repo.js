const database = require('../models');

class CartRepository {
    // Cart

    // Tìm cart đang active của user
    static async findActiveCartByUser(userId, transaction = undefined) {
        return database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
            transaction,
        });
    }

    // Tìm cart theo id, có thể include các liên kết (lineItems, product...)
    static async findCartById(id, include = [], transaction = undefined) {
        return database.Cart.findByPk(id, { include, transaction });
    }

    // Tạo mới cart
    static async createCart(data, transaction = undefined) {
        return database.Cart.create(data, { transaction });
    }

    // Cập nhật cart theo id
    static async updateCart(id, data, transaction = undefined) {
        return database.Cart.update(data, { where: { id }, transaction });
    }

    // CartLineItem

    // Xóa tất cả line item của cart
    static async destroyCartLineItems(cartId, transaction = undefined) {
        return database.CartLineItem.destroy({
            where: { cart_id: cartId },
            transaction,
        });
    }

    // Tạo mới line item
    static async createCartLineItem(data, transaction = undefined) {
        return database.CartLineItem.create(data, { transaction });
    }

    // Tìm line item theo cartId và productId
    static async findCartLineItem(cartId, productId, transaction = undefined) {
        return database.CartLineItem.findOne({
            where: { cart_id: cartId, product_id: productId },
            transaction,
        });
    }

    // Lấy tất cả line items của cart
    static async findAllCartLineItems(cartId, transaction = undefined) {
        return database.CartLineItem.findAll({
            where: { cart_id: cartId },
            transaction,
        });
    }

    // Tổng quantity của line items trong cart
    static async sumCartLineItemQuantity(cartId) {
        return database.CartLineItem.sum('quantity', {
            where: { cart_id: cartId },
        });
    }

    // Xóa line item theo cartId và productId
    static async deleteCartLineItem(
        cartId,
        productId,
        transaction = undefined,
    ) {
        return database.CartLineItem.destroy({
            where: { cart_id: cartId, product_id: productId },
            transaction,
        });
    }
}

module.exports = CartRepository;
