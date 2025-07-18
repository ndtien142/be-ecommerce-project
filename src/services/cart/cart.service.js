'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils'); // <-- add this import

class CartService {
    static async createCart({
        userId,
        status = 'active',
        totalAmount = 0.0,
        lineItems = [],
    }) {
        if (!userId) throw new BadRequestError('userId là bắt buộc');

        // Check if user already has an active cart
        const existingActiveCart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
        });
        if (existingActiveCart) {
            throw new BadRequestError(
                'Người dùng đã có giỏ hàng đang hoạt động',
            );
        }

        const transaction = await database.sequelize.transaction();
        try {
            const cart = await database.Cart.create(
                {
                    user_id: userId,
                    status,
                    total_amount: totalAmount,
                },
                { transaction },
            );

            // Create line items if provided
            if (Array.isArray(lineItems) && lineItems.length > 0) {
                for (const item of lineItems) {
                    await database.CartLineItem.create(
                        {
                            cart_id: cart.id,
                            sku_id: item.skuId,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.total,
                        },
                        { transaction },
                    );
                }
            }

            await transaction.commit();
            return await CartService.getCartById(cart.id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async getCartById(id) {
        const cart = await database.Cart.findByPk(id, {
            include: [
                {
                    model: database.CartLineItem,
                    as: 'lineItems',
                    include: [
                        {
                            model: database.Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        });
        if (!cart) throw new NotFoundError('Cart not found');
        return toCamel(cart.toJSON());
    }

    static async getCartsByUserId(userId) {
        // Only return the active cart for the user
        console.log(`Fetching active cart for userId: ${userId}`);
        if (!userId) throw new BadRequestError('userId is required');

        const cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
            include: [
                {
                    model: database.CartLineItem,
                    as: 'lineItems',
                    include: [
                        {
                            model: database.Product,
                            as: 'product',
                        },
                    ],
                },
            ],
        });

        console.log(`Found cart: ${JSON.stringify(cart)}`);

        return cart ? toCamel(cart.toJSON()) : null;
    }

    static async updateCart(id, updateData) {
        const mappedData = {};
        if (updateData.status !== undefined)
            mappedData.status = updateData.status;
        if (updateData.totalAmount !== undefined)
            mappedData.total_amount = updateData.totalAmount;

        const [affectedRows] = await database.Cart.update(mappedData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Cart not found or not updated');

        // Optionally update line items
        if (Array.isArray(updateData.lineItems)) {
            // Remove old line items and insert new
            await database.CartLineItem.destroy({ where: { cart_id: id } });
            for (const item of updateData.lineItems) {
                await database.CartLineItem.create({
                    cart_id: id,
                    sku_id: item.skuId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                });
            }
        }
        return await CartService.getCartById(id);
    }

    static async deleteCart(id) {
        // Change cart status to 'inactive' instead of deleting
        const [affectedRows] = await database.Cart.update(
            { status: 'inactive' },
            { where: { id } },
        );
        if (!affectedRows)
            throw new NotFoundError('Không tìm thấy giỏ hàng hoặc đã bị xóa');
        return {
            message: 'Đặt giỏ hàng thành trạng thái không hoạt động thành công',
        };
    }

    static async addToCart({ userId, productId, quantity = 1, price }) {
        if (!userId) throw new BadRequestError('userId là bắt buộc');
        if (!productId) throw new BadRequestError('productId là bắt buộc');
        if (!price) throw new BadRequestError('price là bắt buộc');

        // Find or create active cart
        let cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
        });

        const transaction = await database.sequelize.transaction();
        try {
            if (!cart) {
                cart = await database.Cart.create(
                    {
                        user_id: userId,
                        status: 'active',
                        total_amount: 0,
                    },
                    { transaction },
                );
            }

            // Check if line item exists
            let lineItem = await database.CartLineItem.findOne({
                where: { cart_id: cart.id, product_id: productId },
                transaction,
            });

            if (lineItem) {
                // Update quantity and total
                lineItem.quantity += quantity;
                lineItem.price = price; // update to latest price
                lineItem.total = lineItem.quantity * price;
                await lineItem.save({ transaction });
            } else {
                // Create new line item
                await database.CartLineItem.create(
                    {
                        cart_id: cart.id,
                        product_id: productId,
                        quantity,
                        price,
                        total: quantity * price,
                    },
                    { transaction },
                );
            }

            // Update cart total_amount
            const allItems = await database.CartLineItem.findAll({
                where: { cart_id: cart.id },
                transaction,
            });
            const totalAmount = allItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            );
            cart.total_amount = totalAmount;
            await cart.save({ transaction });

            await transaction.commit();
            return await CartService.getCartById(cart.id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async minusItemQuantity({ userId, productId, quantity = 1 }) {
        if (!userId) throw new BadRequestError('userId is required');
        if (!productId) throw new BadRequestError('productId is required');
        if (!quantity || quantity < 1)
            throw new BadRequestError('quantity must be at least 1');

        // Find active cart
        const cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
        });
        if (!cart) throw new NotFoundError('Active cart not found');

        const transaction = await database.sequelize.transaction();
        try {
            // Find line item
            let lineItem = await database.CartLineItem.findOne({
                where: { cart_id: cart.id, product_id: productId },
                transaction,
            });
            if (!lineItem) throw new NotFoundError('Cart item not found');

            // Decrease quantity or remove item
            if (lineItem.quantity > quantity) {
                lineItem.quantity -= quantity;
                lineItem.total = lineItem.quantity * Number(lineItem.price);
                await lineItem.save({ transaction });
            } else {
                // Remove item if quantity is 0 or less
                await lineItem.destroy({ transaction });
            }

            // Update cart total_amount
            const allItems = await database.CartLineItem.findAll({
                where: { cart_id: cart.id },
                transaction,
            });
            const totalAmount = allItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            );
            cart.total_amount = totalAmount;
            await cart.save({ transaction });

            await transaction.commit();
            return await CartService.getCartById(cart.id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async plusItemQuantity({ userId, productId, quantity = 1 }) {
        if (!userId) throw new BadRequestError('userId is required');
        if (!productId) throw new BadRequestError('productId is required');
        if (!quantity || quantity < 1)
            throw new BadRequestError('quantity must be at least 1');

        // Find active cart
        const cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
        });
        if (!cart) throw new NotFoundError('Active cart not found');

        const transaction = await database.sequelize.transaction();
        try {
            // Find line item
            let lineItem = await database.CartLineItem.findOne({
                where: { cart_id: cart.id, product_id: productId },
                transaction,
            });
            if (!lineItem) throw new NotFoundError('Cart item not found');

            // Increase quantity
            lineItem.quantity += quantity;
            lineItem.total = lineItem.quantity * Number(lineItem.price);
            await lineItem.save({ transaction });

            // Update cart total_amount
            const allItems = await database.CartLineItem.findAll({
                where: { cart_id: cart.id },
                transaction,
            });
            const totalAmount = allItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            );
            cart.total_amount = totalAmount;
            await cart.save({ transaction });

            await transaction.commit();
            return await CartService.getCartById(cart.id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async removeItemFromCart({ userId, productId }) {
        if (!userId) throw new BadRequestError('userId là bắt buộc');
        if (!productId) throw new BadRequestError('productId là bắt buộc');

        // Find active cart
        const cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
        });
        if (!cart)
            throw new NotFoundError('Không tìm thấy giỏ hàng đang hoạt động');

        const transaction = await database.sequelize.transaction();
        try {
            // Remove line item
            await database.CartLineItem.destroy({
                where: { cart_id: cart.id, product_id: productId },
                transaction,
            });

            // Update cart total_amount
            const allItems = await database.CartLineItem.findAll({
                where: { cart_id: cart.id },
                transaction,
            });
            const totalAmount = allItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            );
            cart.total_amount = totalAmount;
            await cart.save({ transaction });

            await transaction.commit();
            return await CartService.getCartById(cart.id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async countCartItems(userId) {
        if (!userId) throw new BadRequestError('userId is required');
        const cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
        });
        if (!cart) return 0;
        const count = await database.CartLineItem.sum('quantity', {
            where: { cart_id: cart.id },
        });
        return count || 0;
    }
}

module.exports = CartService;
