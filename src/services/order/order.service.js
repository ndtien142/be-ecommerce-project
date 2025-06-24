'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class OrderService {
    static async createOrder({
        userId,
        cart,
        addressId,
        paymentMethodId,
        shippingMethodId,
        note,
        shippingFee = 0,
        trackingNumber = null,
        shippedBy = null,
        orderedDate = new Date(),
    }) {
        // Validate required fields
        if (!userId) throw new BadRequestError('userId is required');
        if (
            !cart ||
            !Array.isArray(cart.lineItems) ||
            cart.lineItems.length === 0
        )
            throw new BadRequestError('cart with lineItems is required');
        if (!addressId) throw new BadRequestError('addressId is required');
        if (!paymentMethodId)
            throw new BadRequestError('paymentMethodId is required');
        if (!shippingMethodId)
            throw new BadRequestError('shippingMethodId is required');

        // Fetch active cart from BE and compare with FE cart
        const beCart = await database.Cart.findOne({
            where: { id: cart.id, user_id: userId, status: 'active' },
            include: [{ model: database.CartLineItem, as: 'lineItems' }],
        });
        if (!beCart) throw new NotFoundError('Active cart not found');

        // Compare FE cart.lineItems with BE cart.lineItems
        const feItems = cart.lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: Number(item.price),
        }));
        const beItems = (beCart.lineItems || []).map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: Number(item.price),
        }));

        if (
            feItems.length !== beItems.length ||
            !feItems.every((feItem) =>
                beItems.some(
                    (beItem) =>
                        beItem.productId === feItem.productId &&
                        beItem.quantity === feItem.quantity &&
                        Number(beItem.price) === Number(feItem.price),
                ),
            )
        ) {
            throw new BadRequestError(
                'Cart items do not match with server cart',
            );
        }

        // Calculate total amount
        const totalAmount =
            beCart.lineItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            ) + Number(shippingFee);

        // Start transaction
        const transaction = await database.sequelize.transaction();
        try {
            // Create order
            const order = await database.Order.create(
                {
                    user_id: userId,
                    address_id: addressId,
                    payment_id: null, // will update after payment created
                    status: 'pending_confirmation',
                    total_amount: totalAmount,
                    note,
                    ordered_date: orderedDate,
                    shipping_method_id: shippingMethodId,
                    shipping_fee: shippingFee,
                    tracking_number: trackingNumber,
                    shipped_by: shippedBy,
                },
                { transaction },
            );

            // Create order line items and update product stock/sold
            for (const item of beCart.lineItems) {
                await database.OrderLineItem.create(
                    {
                        order_id: order.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.total,
                    },
                    { transaction },
                );

                // Update product stock and sold
                const product = await database.Product.findByPk(
                    item.product_id,
                    { transaction },
                );
                if (product) {
                    product.stock =
                        Number(product.stock) - Number(item.quantity);
                    product.sold =
                        Number(product.sold || 0) + Number(item.quantity);

                    if (product.stock <= 0) {
                        product.inventory_type = 'out_of_stock';
                        product.stock = 0;
                    } else if (product.stock <= (product.min_stock || 0)) {
                        product.inventory_type = 'low_stock';
                    } else {
                        product.inventory_type = 'in_stock';
                    }
                    await product.save({ transaction });
                }
            }

            // Create payment record and update order.payment_id
            const payment = await database.Payment.create(
                {
                    order_id: order.id,
                    payment_method_id: paymentMethodId,
                    amount: totalAmount,
                    status: 'pending',
                },
                { transaction },
            );
            order.payment_id = payment.id;
            await order.save({ transaction });

            // Set cart status to 'ordered'
            beCart.status = 'ordered';
            await beCart.save({ transaction });

            await transaction.commit();

            // Return order with line items and relations
            const createdOrder = await database.Order.findByPk(order.id, {
                include: [
                    {
                        model: database.OrderLineItem,
                        as: 'lineItems',
                        include: [{ model: database.Product, as: 'product' }],
                    },
                    { model: database.UserAddress, as: 'address' },
                    { model: database.ShippingMethod, as: 'shippingMethod' },
                    { model: database.Payment, as: 'payment' },
                ],
            });

            return toCamel(createdOrder.toJSON());
        } catch (err) {
            if (
                transaction.finished !== 'commit' &&
                transaction.finished !== 'rollback'
            ) {
                await transaction.rollback();
            }
            throw err;
        }
    }

    static async getOrderById(id) {
        const order = await database.Order.findByPk(id, {
            include: [
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                { model: database.Payment, as: 'payment' },
            ],
        });
        if (!order) throw new NotFoundError('Order not found');
        return toCamel(order.toJSON());
    }

    static async getOrdersByUser(userId, { page = 1, limit = 20 } = {}) {
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;
        const orders = await database.Order.findAndCountAll({
            where: { user_id: userId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                { model: database.Payment, as: 'payment' },
            ],
        });
        return {
            items: orders.rows.map((o) => toCamel(o.toJSON())),
            meta: {
                currentPage: page,
                itemPerPage: limit,
                totalItems: orders.count,
                totalPages: Math.ceil(orders.count / limit),
            },
        };
    }

    static async updateOrderStatus(id, status) {
        const [affectedRows] = await database.Order.update(
            { status },
            { where: { id } },
        );
        if (!affectedRows)
            throw new NotFoundError('Order not found or not updated');
        return await OrderService.getOrderById(id);
    }

    static async cancelOrder(id) {
        return await OrderService.updateOrderStatus(id, 'cancelled');
    }

    static async updateOrderAddress(orderId, newAddressId) {
        const order = await database.Order.findByPk(orderId);
        if (!order) throw new NotFoundError('Order not found');
        if (
            ['shipping', 'delivered', 'returned', 'cancelled'].includes(
                order.status,
            )
        ) {
            throw new BadRequestError(
                'Cannot change address when order is shipping, delivered, returned, or cancelled',
            );
        }
        order.address_id = newAddressId;
        await order.save();
        return await OrderService.getOrderById(orderId);
    }
}

module.exports = OrderService;
