'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');
const MomoPaymentService = require('../payment/momo.service');
const EmailService = require('../email/email.service');

class OrderService {
    // Helper method to validate stock availability
    static async validateStockAvailability(cartItems) {
        for (const item of cartItems) {
            const product = await database.Product.findByPk(item.product_id);
            if (!product) {
                throw new NotFoundError(
                    `Không tìm thấy sản phẩm có ID: ${item.product_id}`,
                );
            }

            const availableStock = Number(product.stock);
            const requestedQuantity = Number(item.quantity);

            if (availableStock < requestedQuantity) {
                throw new BadRequestError(
                    `Sản phẩm "${product.name}" chỉ còn ${availableStock} sản phẩm trong kho, không đủ cho số lượng yêu cầu ${requestedQuantity}`,
                );
            }

            if (product.status !== 'active') {
                throw new BadRequestError(
                    `Sản phẩm "${product.name}" không còn khả dụng`,
                );
            }
        }
    }

    // Helper method to update product stock and sold count
    static async updateProductStock(cartItems, transaction) {
        for (const item of cartItems) {
            const product = await database.Product.findByPk(item.product_id, {
                transaction,
            });

            if (product) {
                product.stock = Number(product.stock) - Number(item.quantity);
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
    }

    static async createOrder({
        userId,
        cart,
        addressId,
        shippingMethodId,
        note,
        shippingFee = 0,
        trackingNumber = null,
        shippedBy = null,
        orderedDate = new Date(),
    }) {
        // Validate required fields
        if (!userId) throw new BadRequestError('userId là bắt buộc');
        if (
            !cart ||
            !Array.isArray(cart.lineItems) ||
            cart.lineItems.length === 0
        )
            throw new BadRequestError('cart với lineItems là bắt buộc');
        if (!addressId) throw new BadRequestError('addressId là bắt buộc');

        if (!shippingMethodId)
            throw new BadRequestError('shippingMethodId là bắt buộc');

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
                'Các mục trong giỏ hàng không khớp với giỏ hàng trên máy chủ',
            );
        }

        // Calculate total amount
        const totalAmount =
            beCart.lineItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            ) + Number(shippingFee);

        // Validate stock availability before creating order
        await OrderService.validateStockAvailability(beCart.lineItems);

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

            // Create order line items
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
            }

            // Update product stock and sold count
            await OrderService.updateProductStock(
                beCart.lineItems,
                transaction,
            );

            // Create payment record and update order.payment_id
            const payment = await database.Payment.create(
                {
                    order_id: order.id,
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
                    { model: database.User, as: 'user' },
                ],
            });

            // Send order confirmation email
            try {
                if (createdOrder.user && createdOrder.user.user_email) {
                    await EmailService.sendOrderConfirmationEmail(
                        createdOrder.user.user_email,
                        createdOrder.user.first_name ||
                            createdOrder.user.user_login,
                        createdOrder,
                    );
                }
            } catch (emailError) {
                console.error(
                    'Failed to send order confirmation email:',
                    emailError,
                );
                // Don't throw error - email failure shouldn't break order creation
            }

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
                { model: database.User, as: 'user' },
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                {
                    model: database.Payment,
                    as: 'payment',
                },
            ],
        });
        if (!order) throw new NotFoundError('Order not found');
        return toCamel(order.toJSON());
    }

    static async getOrderByIdForUser(orderId, userId) {
        if (!userId) throw new BadRequestError('userId là bắt buộc');
        const order = await database.Order.findByPk(orderId, {
            include: [
                { model: database.User, as: 'user' },
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                {
                    model: database.Payment,
                    as: 'payment',
                },
            ],
        });
        if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
        if (order.user_id !== Number(userId)) {
            throw new BadRequestError('Bạn không có quyền xem đơn hàng này');
        }
        return toCamel(order.toJSON());
    }

    static async getOrdersByUser(
        userId,
        { page = 1, limit = 20, status, startDate, endDate } = {},
    ) {
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;
        const where = { user_id: userId };
        if (status) {
            where.status = status;
        }
        if (startDate || endDate) {
            where.ordered_date = {};
            if (startDate) {
                // Set to start of day (00:00:00)
                const startOfDay = new Date(startDate);
                startOfDay.setHours(0, 0, 0, 0);
                where.ordered_date[database.Sequelize.Op.gte] = startOfDay;
            }
            if (endDate) {
                // Set to end of day (23:59:59.999)
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                where.ordered_date[database.Sequelize.Op.lte] = endOfDay;
            }
        }
        const orders = await database.Order.findAndCountAll({
            where,
            limit,
            offset,
            order: [['create_time', 'DESC']],
            include: [
                { model: database.User, as: 'user' },
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                {
                    model: database.Payment,
                    as: 'payment',
                },
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

    static async getOrdersByAdmin({
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
    } = {}) {
        limit = Number(limit) || 20;
        page = Number(page) || 1;
        const offset = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (startDate || endDate) {
            where.ordered_date = {};
            if (startDate) {
                // Set to start of day (00:00:00)
                const startOfDay = new Date(startDate);
                startOfDay.setHours(0, 0, 0, 0);
                where.ordered_date[database.Sequelize.Op.gte] = startOfDay;
            }
            if (endDate) {
                // Set to end of day (23:59:59.999)
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                where.ordered_date[database.Sequelize.Op.lte] = endOfDay;
            }
        }
        const orders = await database.Order.findAndCountAll({
            where,
            limit,
            offset,
            order: [['create_time', 'DESC']],
            include: [
                { model: database.User, as: 'user' },
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                {
                    model: database.Payment,
                    as: 'payment',
                },
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

    // DEPRECATED: Sử dụng OrderWorkflowService.confirmOrder() thay thế
    // static async updateOrderStatus(id, status) { ... }

    // DEPRECATED: Sử dụng OrderWorkflowService.cancelOrder() thay thế
    // static async cancelOrder(id, reason = '') { ... }

    static async updateOrderAddress(orderId, newAddressId) {
        const order = await database.Order.findByPk(orderId);
        if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
        if (
            ['shipping', 'delivered', 'returned', 'cancelled'].includes(
                order.status,
            )
        ) {
            throw new BadRequestError(
                'Không thể thay đổi địa chỉ khi đơn hàng đang vận chuyển, đã giao, đã trả lại hoặc đã hủy',
            );
        }
        order.address_id = newAddressId;
        await order.save();
        return await OrderService.getOrderById(orderId);
    }

    static async countOrdersByStatus(userId) {
        if (!userId) throw new BadRequestError('userId is required');
        const statuses = [
            'pending_confirmation',
            'pending_pickup',
            'shipping',
            'delivered',
            'returned',
            'cancelled',
        ];
        const result = {};
        for (const status of statuses) {
            result[status] = await database.Order.count({
                where: { user_id: userId, status },
            });
        }
        return toCamel(result);
    }

    static async countOrdersByStatusForAdmin() {
        const statuses = [
            'pending_confirmation',
            'pending_pickup',
            'shipping',
            'delivered',
            'returned',
            'cancelled',
        ];
        const result = {};
        for (const status of statuses) {
            result[status] = await database.Order.count({
                where: { status },
            });
        }
        return toCamel(result);
    }

    static async createOrderWithMoMo({
        userId,
        cart,
        addressId,
        shippingMethodId,
        note,
        shippingFee = 0,
        orderInfo = 'Thanh toán đơn hàng',
        extraData = '',
    }) {
        // Validate required fields
        if (!userId) throw new BadRequestError('userId là bắt buộc');
        if (
            !cart ||
            !Array.isArray(cart.lineItems) ||
            cart.lineItems.length === 0
        )
            throw new BadRequestError('cart với lineItems là bắt buộc');
        if (!addressId) throw new BadRequestError('addressId là bắt buộc');
        if (!shippingMethodId)
            throw new BadRequestError('shippingMethodId là bắt buộc');

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
                'Các mục trong giỏ hàng không khớp với giỏ hàng trên máy chủ',
            );
        }

        // Calculate total amount
        const totalAmount =
            beCart.lineItems.reduce(
                (sum, item) => sum + Number(item.total),
                0,
            ) + Number(shippingFee);

        // Validate stock availability before creating order
        await OrderService.validateStockAvailability(beCart.lineItems);

        // Start transaction
        const transaction = await database.sequelize.transaction();
        try {
            // Update product stock and sold count immediately (same as COD)
            await OrderService.updateProductStock(
                beCart.lineItems,
                transaction,
            );

            beCart.status = 'ordered';
            await beCart.save({ transaction });
            // Create order
            const order = await database.Order.create(
                {
                    user_id: userId,
                    address_id: addressId,
                    payment_id: null,
                    status: 'pending_confirmation',
                    total_amount: totalAmount,
                    note,
                    ordered_date: new Date(),
                    shipping_method_id: shippingMethodId,
                    shipping_fee: shippingFee,
                },
                { transaction },
            );

            // Create order line items (but don't update stock yet - wait for payment)
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
            }

            await order.save({ transaction });

            // Create MoMo payment first, before committing transaction
            // Generate unique MoMo order ID to avoid duplicates
            const momoOrderId = `ORDER_${order.id}_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

            const momoPayment = await MomoPaymentService.createPayment({
                orderId: order.id,
                momoOrderId: momoOrderId,
                amount: Math.round(totalAmount), // MoMo requires integer amount
                orderInfo: orderInfo,
                extraData: extraData,
                internalOrderId: order.id.toString(), // Pass internal order ID for mapping
            });

            const payment = await database.Payment.create(momoPayment.payment);

            order.payment_id = payment.id; // Set payment ID in order
            await order.save({ transaction });

            // Only commit transaction after MoMo payment is successfully created
            await transaction.commit();

            // Get full order data for email
            const fullOrder = await database.Order.findByPk(order.id, {
                include: [
                    {
                        model: database.OrderLineItem,
                        as: 'lineItems',
                        include: [{ model: database.Product, as: 'product' }],
                    },
                    { model: database.UserAddress, as: 'address' },
                    { model: database.ShippingMethod, as: 'shippingMethod' },
                    { model: database.Payment, as: 'payment' },
                    { model: database.User, as: 'user' },
                ],
            });

            // Send order confirmation email
            try {
                if (fullOrder.user && fullOrder.user.email) {
                    await EmailService.sendOrderConfirmationEmail(
                        fullOrder.user.email,
                        fullOrder.user.first_name || fullOrder.user.username,
                        fullOrder,
                    );
                }
            } catch (emailError) {
                console.error(
                    'Failed to send order confirmation email:',
                    emailError,
                );
                // Don't throw error - email failure shouldn't break order creation
            }

            return {
                order: toCamel(order.toJSON()),
                momoPayment: momoPayment,
            };
        } catch (error) {
            // Only rollback if transaction hasn't been committed yet
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    static async completeOrderPayment(orderId) {
        const transaction = await database.sequelize.transaction();
        try {
            // Get order with line items
            const order = await database.Order.findOne({
                where: { id: orderId },
                include: [{ model: database.OrderLineItem, as: 'lineItems' }],
                transaction,
            });

            if (!order) throw new NotFoundError('Order not found');

            // Stock was already updated when order was created
            // Just update order status to confirm payment
            order.status = 'pending_confirmation';
            await order.save({ transaction });

            // Update payment status to completed
            if (order.payment_id) {
                await database.Payment.update(
                    { status: 'completed' },
                    { where: { id: order.payment_id }, transaction },
                );
            }

            await transaction.commit();
            return toCamel(order.toJSON());
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async failOrderPayment(orderId) {
        const transaction = await database.sequelize.transaction();
        try {
            // Get order with line items
            const order = await database.Order.findOne({
                where: { id: orderId },
                include: [{ model: database.OrderLineItem, as: 'lineItems' }],
                transaction,
            });

            if (!order) throw new NotFoundError('Order not found');

            // Return stock to inventory (reverse the stock update)
            for (const item of order.lineItems) {
                const product = await database.Product.findByPk(
                    item.product_id,
                    { transaction },
                );

                if (product) {
                    // Return stock and reduce sold count
                    product.stock =
                        Number(product.stock) + Number(item.quantity);
                    product.sold = Math.max(
                        0,
                        Number(product.sold || 0) - Number(item.quantity),
                    );

                    // Update inventory type based on new stock level
                    if (product.stock <= 0) {
                        product.inventory_type = 'out_of_stock';
                    } else if (product.stock <= (product.min_stock || 0)) {
                        product.inventory_type = 'low_stock';
                    } else {
                        product.inventory_type = 'in_stock';
                    }

                    await product.save({ transaction });
                }
            }

            // Update order status to failed
            order.status = 'payment_failed';
            await order.save({ transaction });

            // Update payment status to failed
            if (order.payment_id) {
                await database.Payment.update(
                    { status: 'failed' },
                    { where: { id: order.payment_id }, transaction },
                );
            }

            await transaction.commit();
            return toCamel(order.toJSON());
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async sendShippingNotification(
        orderId,
        trackingNumber,
        carrier = '',
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [
                { model: database.User, as: 'user' },
                { model: database.UserAddress, as: 'address' },
                { model: database.ShippingMethod, as: 'shippingMethod' },
                {
                    model: database.OrderLineItem,
                    as: 'lineItems',
                    include: [{ model: database.Product, as: 'product' }],
                },
            ],
        });

        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng');
        }

        // Update tracking number
        await database.Order.update(
            {
                tracking_number: trackingNumber,
                shipped_by: carrier,
                status: 'shipping',
            },
            { where: { id: orderId } },
        );

        // Send shipping notification email
        try {
            if (order.user && order.user.user_email) {
                await EmailService.sendOrderStatusUpdateEmail(
                    order.user.user_email,
                    order.user.first_name || order.user.user_login,
                    { ...order.toJSON(), trackingNumber, shippedBy: carrier },
                    'shipping',
                );
            }
        } catch (emailError) {
            console.error(
                'Failed to send shipping notification email:',
                emailError,
            );
            // Don't throw error - email failure shouldn't break shipping update
        }

        return await OrderService.getOrderById(orderId);
    }
}

module.exports = OrderService;
