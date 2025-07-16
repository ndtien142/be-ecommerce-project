'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');
const MomoPaymentService = require('../payment/momo.service');
const EmailService = require('../email/email.service');
const CouponService = require('../promotion/coupon.service');
const ProductSaleService = require('../promotion/productSale.service');

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
        couponCode = null,
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

        // Calculate product prices with sales
        const itemsWithPrices = await OrderService.calculateProductPrices(
            beCart.lineItems,
        );

        // Calculate initial totals
        const initialSubtotal = itemsWithPrices.reduce(
            (sum, item) => sum + item.total_price,
            0,
        );

        // Process coupon discount
        const order_data = {
            subtotal: initialSubtotal,
            shipping_fee: shippingFee,
            items: itemsWithPrices,
        };

        const couponDiscount = await OrderService.processCouponDiscount(
            userId,
            couponCode,
            order_data,
        );

        // Calculate final totals
        const orderTotals = OrderService.calculateOrderTotals(
            itemsWithPrices,
            shippingFee,
            couponDiscount,
        );

        // Update beCart.lineItems with calculated prices
        beCart.lineItems = itemsWithPrices.map((item) => ({
            ...item,
            price: item.price,
            total: item.total_price,
        }));

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
                    subtotal: orderTotals.subtotal,
                    discount_amount: orderTotals.coupon_discount_amount,
                    shipping_discount: orderTotals.shipping_discount,
                    total_amount: orderTotals.total_amount,
                    coupon_codes: couponDiscount.applied_coupon
                        ? [couponDiscount.applied_coupon.code]
                        : null,
                    note,
                    ordered_date: orderedDate,
                    shipping_method_id: shippingMethodId,
                    shipping_fee: orderTotals.final_shipping_fee,
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

            // Create order coupon record if coupon was applied
            if (couponDiscount.applied_coupon) {
                await CouponService.applyCouponToOrder(
                    order.id,
                    couponDiscount.applied_coupon.id,
                    couponDiscount.user_coupon
                        ? couponDiscount.user_coupon.id
                        : null,
                    couponDiscount.order_coupon_data,
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
                    amount: orderTotals.total_amount,
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
        couponCode = null,
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

        // Calculate product prices with sales
        const itemsWithPrices = await OrderService.calculateProductPrices(
            beCart.lineItems,
        );

        // Calculate initial totals
        const initialSubtotal = itemsWithPrices.reduce(
            (sum, item) => sum + item.total_price,
            0,
        );

        // Process coupon discount
        const order_data = {
            subtotal: initialSubtotal,
            shipping_fee: shippingFee,
            items: itemsWithPrices,
        };

        const couponDiscount = await OrderService.processCouponDiscount(
            userId,
            couponCode,
            order_data,
        );

        // Calculate final totals
        const orderTotals = OrderService.calculateOrderTotals(
            itemsWithPrices,
            shippingFee,
            couponDiscount,
        );

        // Update beCart.lineItems with calculated prices
        beCart.lineItems = itemsWithPrices.map((item) => ({
            ...item,
            price: item.price,
            total: item.total_price,
        }));

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
                    subtotal: orderTotals.subtotal,
                    discount_amount: orderTotals.coupon_discount_amount,
                    shipping_discount: orderTotals.shipping_discount,
                    total_amount: orderTotals.total_amount,
                    coupon_codes: couponDiscount.applied_coupon
                        ? [couponDiscount.applied_coupon.code]
                        : null,
                    note,
                    ordered_date: new Date(),
                    shipping_method_id: shippingMethodId,
                    shipping_fee: orderTotals.final_shipping_fee,
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

            // Create order coupon record if coupon was applied
            if (couponDiscount.applied_coupon) {
                await CouponService.applyCouponToOrder(
                    order.id,
                    couponDiscount.applied_coupon.id,
                    couponDiscount.user_coupon
                        ? couponDiscount.user_coupon.id
                        : null,
                    couponDiscount.order_coupon_data,
                );
            }

            await order.save({ transaction });

            // Create MoMo payment first, before committing transaction
            // Generate unique MoMo order ID to avoid duplicates
            const momoOrderId = `ORDER_${order.id}_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

            const momoPayment = await MomoPaymentService.createPayment({
                orderId: order.id,
                momoOrderId: momoOrderId,
                amount: Math.round(orderTotals.total_amount), // MoMo requires integer amount
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

    // Helper method to calculate product prices with sales
    static async calculateProductPrices(cartItems) {
        const itemsWithPrices = [];

        for (const item of cartItems) {
            const product = await database.Product.findByPk(item.product_id);
            if (!product) {
                throw new NotFoundError(
                    `Không tìm thấy sản phẩm có ID: ${item.product_id}`,
                );
            }

            // Check if product has active sale
            const productSale = await ProductSaleService.getActiveProductSale(
                item.product_id,
            );

            const price = productSale ? productSale.sale_price : product.price;
            const original_price = product.price;
            const discount_per_item = original_price - price;

            itemsWithPrices.push({
                ...item,
                product_name: product.name,
                original_price,
                price,
                discount_per_item,
                total_price: price * item.quantity,
                total_discount: discount_per_item * item.quantity,
                product_sale_id: productSale ? productSale.id : null,
            });
        }

        return itemsWithPrices;
    }

    // Helper method to process coupon discount
    static async processCouponDiscount(user_id, coupon_code, order_data) {
        if (!coupon_code) {
            return {
                discount_amount: 0,
                shipping_discount: 0,
                applied_coupon: null,
                order_coupon_data: null,
            };
        }

        // Validate coupon
        const coupon = await CouponService.validateCoupon(
            coupon_code,
            user_id,
            order_data,
        );

        // Calculate discount
        const discount = CouponService.calculateDiscount(coupon, order_data);

        // Check if user has this coupon (for personal vouchers)
        const userCoupon = await database.UserCoupon.findOne({
            where: {
                user_id,
                coupon_id: coupon.id,
                is_active: true,
            },
        });

        // Prepare order coupon data
        const orderCouponData = {
            coupon_code: coupon.code,
            discount_type: coupon.type,
            discount_value: coupon.value,
            discount_amount: discount.discount_amount,
            order_subtotal: order_data.subtotal,
            shipping_fee: order_data.shipping_fee,
            shipping_discount: discount.shipping_discount,
            applied_products: order_data.items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })),
            conditions_met: {
                min_order_amount: coupon.min_order_amount,
                applicable_products: coupon.applicable_products,
                applicable_categories: coupon.applicable_categories,
            },
        };

        return {
            discount_amount: discount.discount_amount,
            shipping_discount: discount.shipping_discount,
            applied_coupon: coupon,
            user_coupon: userCoupon,
            order_coupon_data: orderCouponData,
        };
    }

    // Helper method to calculate order totals
    static calculateOrderTotals(
        items_with_prices,
        shipping_fee,
        coupon_discount,
    ) {
        const subtotal = items_with_prices.reduce(
            (sum, item) => sum + item.total_price,
            0,
        );
        const product_discount = items_with_prices.reduce(
            (sum, item) => sum + item.total_discount,
            0,
        );
        const coupon_discount_amount = coupon_discount.discount_amount || 0;
        const shipping_discount = coupon_discount.shipping_discount || 0;

        const total_discount = coupon_discount_amount + shipping_discount;
        const final_shipping_fee = Math.max(
            0,
            shipping_fee - shipping_discount,
        );
        const total_amount =
            subtotal - coupon_discount_amount + final_shipping_fee;

        return {
            subtotal,
            product_discount,
            coupon_discount_amount,
            shipping_discount,
            total_discount,
            final_shipping_fee,
            total_amount,
        };
    }
}

module.exports = OrderService;
