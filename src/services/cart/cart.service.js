'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const { toCamel } = require('../../utils/common.utils');
const database = require('../../models');
const CartRepository = require('../../repositories/categories/cart.repo');
const {
    createCartSchema,
    addToCartSchema,
    updateCartSchema,
    itemQuantitySchema,
    removeItemSchema,
} = require('../../schema/cart.schema');

class CartService {
    static async createCart(payload) {
        const { error, value } = createCartSchema.validate(payload);
        if (error) throw new BadRequestError(error.details[0].message);

        const { userId, status, totalAmount, lineItems } = value;
        const existingActiveCart =
            await CartRepository.findActiveCartByUser(userId);
        if (existingActiveCart)
            throw new BadRequestError(
                'Người dùng đã có giỏ hàng đang hoạt động',
            );

        const transaction = await database.sequelize.transaction();
        try {
            const cart = await CartRepository.createCart(
                {
                    user_id: userId,
                    status,
                    total_amount: totalAmount,
                },
                transaction,
            );

            if (Array.isArray(lineItems) && lineItems.length > 0) {
                for (const item of lineItems) {
                    await CartRepository.createCartLineItem(
                        {
                            cart_id: cart.id,
                            sku_id: item.skuId,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.total,
                        },
                        transaction,
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
        const include = [
            {
                model: database.CartLineItem,
                as: 'lineItems',
                include: [{ model: database.Product, as: 'product' }],
            },
        ];
        const cart = await CartRepository.findCartById(id, include);
        if (!cart) throw new NotFoundError('Cart not found');
        return toCamel(cart.toJSON());
    }

    static async getCartsByUserId(userId) {
        if (!userId) throw new BadRequestError('userId is required');
        const include = [
            {
                model: database.CartLineItem,
                as: 'lineItems',
                include: [{ model: database.Product, as: 'product' }],
            },
        ];
        const cart = await database.Cart.findOne({
            where: { user_id: userId, status: 'active' },
            include,
        });
        return cart ? toCamel(cart.toJSON()) : null;
    }

    static async updateCart(id, updateData) {
        const { error, value } = updateCartSchema.validate(updateData);
        if (error) throw new BadRequestError(error.details[0].message);

        const mappedData = {};
        if (value.status !== undefined) mappedData.status = value.status;
        if (value.totalAmount !== undefined)
            mappedData.total_amount = value.totalAmount;

        const [affectedRows] = await CartRepository.updateCart(id, mappedData);
        if (!affectedRows)
            throw new NotFoundError('Cart not found or not updated');

        if (Array.isArray(value.lineItems)) {
            await CartRepository.destroyCartLineItems(id);
            for (const item of value.lineItems) {
                await CartRepository.createCartLineItem({
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
        const [affectedRows] = await CartRepository.updateCart(id, {
            status: 'inactive',
        });
        if (!affectedRows)
            throw new NotFoundError('Không tìm thấy giỏ hàng hoặc đã bị xóa');
        return {
            message: 'Đặt giỏ hàng thành trạng thái không hoạt động thành công',
        };
    }

    static async addToCart(payload) {
        const { error, value } = addToCartSchema.validate(payload);
        if (error) throw new BadRequestError(error.details[0].message);

        const { userId, productId, quantity, price } = value;
        let cart = await CartRepository.findActiveCartByUser(userId);

        const transaction = await database.sequelize.transaction();
        try {
            if (!cart) {
                cart = await CartRepository.createCart(
                    {
                        user_id: userId,
                        status: 'active',
                        total_amount: 0,
                    },
                    transaction,
                );
            }

            let lineItem = await CartRepository.findCartLineItem(
                cart.id,
                productId,
                transaction,
            );

            if (lineItem) {
                lineItem.quantity += quantity;
                lineItem.price = price;
                lineItem.total = lineItem.quantity * price;
                await lineItem.save({ transaction });
            } else {
                await CartRepository.createCartLineItem(
                    {
                        cart_id: cart.id,
                        product_id: productId,
                        quantity,
                        price,
                        total: quantity * price,
                    },
                    transaction,
                );
            }

            const allItems = await CartRepository.findAllCartLineItems(
                cart.id,
                transaction,
            );
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

    static async minusItemQuantity(payload) {
        const { error, value } = itemQuantitySchema.validate(payload);
        if (error) throw new BadRequestError(error.details[0].message);

        const { userId, productId, quantity } = value;
        const cart = await CartRepository.findActiveCartByUser(userId);
        if (!cart) throw new NotFoundError('Active cart not found');

        const transaction = await database.sequelize.transaction();
        try {
            let lineItem = await CartRepository.findCartLineItem(
                cart.id,
                productId,
                transaction,
            );
            if (!lineItem) throw new NotFoundError('Cart item not found');

            if (lineItem.quantity > quantity) {
                lineItem.quantity -= quantity;
                lineItem.total = lineItem.quantity * Number(lineItem.price);
                await lineItem.save({ transaction });
            } else {
                await lineItem.destroy({ transaction });
            }

            const allItems = await CartRepository.findAllCartLineItems(
                cart.id,
                transaction,
            );
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

    static async plusItemQuantity(payload) {
        const { error, value } = itemQuantitySchema.validate(payload);
        if (error) throw new BadRequestError(error.details[0].message);

        const { userId, productId, quantity } = value;
        const cart = await CartRepository.findActiveCartByUser(userId);
        if (!cart) throw new NotFoundError('Active cart not found');

        const transaction = await database.sequelize.transaction();
        try {
            let lineItem = await CartRepository.findCartLineItem(
                cart.id,
                productId,
                transaction,
            );
            if (!lineItem) throw new NotFoundError('Cart item not found');

            lineItem.quantity += quantity;
            lineItem.total = lineItem.quantity * Number(lineItem.price);
            await lineItem.save({ transaction });

            const allItems = await CartRepository.findAllCartLineItems(
                cart.id,
                transaction,
            );
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

    static async removeItemFromCart(payload) {
        const { error, value } = removeItemSchema.validate(payload);
        if (error) throw new BadRequestError(error.details[0].message);

        const { userId, productId } = value;
        const cart = await CartRepository.findActiveCartByUser(userId);
        if (!cart)
            throw new NotFoundError('Không tìm thấy giỏ hàng đang hoạt động');

        const transaction = await database.sequelize.transaction();
        try {
            await CartRepository.deleteCartLineItem(
                cart.id,
                productId,
                transaction,
            );

            const allItems = await CartRepository.findAllCartLineItems(
                cart.id,
                transaction,
            );
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
        const cart = await CartRepository.findActiveCartByUser(userId);
        if (!cart) return 0;
        const count = await CartRepository.sumCartLineItemQuantity(cart.id);
        return count || 0;
    }
}

module.exports = CartService;
