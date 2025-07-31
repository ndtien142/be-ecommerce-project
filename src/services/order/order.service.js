'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');
const MomoPaymentService = require('../payment/momo.service');
const EmailService = require('../email/email.service');
const CouponService = require('../promotion/coupon.service');
const { getProductById } = require('../../repositories/product/product.repo');

class OrderService {
    // Helper method to validate stock availability
    static async validateStockAvailability(cartItems) {
        for (const item of cartItems) {
            const product = await getProductById(item.product_id);
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

    // Helper method to process coupon discount
    static async processCouponDiscount(userId, couponCode, orderData) {
        if (!couponCode) {
            return {
                discountAmount: 0,
                shippingDiscount: 0,
                appliedCoupon: null,
                orderCouponData: null,
            };
        }

        // Validate coupon
        const coupon = await CouponService.validateCoupon(
            couponCode,
            userId,
            orderData,
        );

        // Calculate discount
        const discount = CouponService.calculateDiscount(coupon, orderData);

        // Prepare order coupon data
        const orderCouponData = {
            couponCode: coupon.code,
            discountType: coupon.type,
            discountValue: coupon.value,
            discountAmount: discount.discountAmount,
            orderSubtotal: orderData.subtotal,
            shippingFee: orderData.shippingFee,
            shippingDiscount: discount.shippingDiscount,
            appliedProducts: orderData.items.map((item) => ({
                productId: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })),
            conditionsMet: {
                minOrderAmount: coupon.minOrderAmount,
                applicableProducts: coupon.applicableProducts,
                applicableCategories: coupon.applicableCategories,
            },
        };

        return {
            discountAmount: discount.discountAmount,
            shippingDiscount: discount.shippingDiscount,
            appliedCoupon: coupon,
            orderCouponData: orderCouponData,
        };
    }

    // Helper method to calculate order totals
    static calculateOrderTotals(
        items_with_prices,
        shipping_fee,
        coupon_discount,
    ) {
        const subtotal = items_with_prices.reduce(
            (sum, item) => sum + Number(item.total),
            0,
        );
        const coupon_discount_amount = coupon_discount.discount_amount || 0;
        const shipping_discount = coupon_discount.shipping_discount || 0;

        const final_shipping_fee = Math.max(
            0,
            shipping_fee - shipping_discount,
        );
        const total_amount =
            subtotal - coupon_discount_amount + final_shipping_fee;

        return {
            subtotal,
            coupon_discount_amount,
            shipping_discount,
            final_shipping_fee,
            total_amount,
        };
    }

    /**
     * Gộp tạo đơn hàng COD và MoMo
     * @param {Object} param - các tham số
     * @param {'cod'|'momo'} param0.paymentMethod - phương thức thanh toán
     * @param {string} [param0.orderInfo] - chỉ dùng cho MoMo
     * @param {string} [param0.extraData] - chỉ dùng cho MoMo
     * @returns {Object} Đơn hàng đã tạo, với momoPayment nếu là momo
     */
    static async createOrderUnified({
        userId,
        cart,
        addressId,
        shippingMethodId,
        note,
        shippingFee = 0,
        orderedDate = new Date(),
        couponCode = null,
        paymentMethod = 'cod',
        orderInfo = 'Thanh toán đơn hàng',
        extraData = '',
    }) {
        // Validate required fields
        if (!userId) throw new BadRequestError('Người dùng là không hợp lệ');
        if (
            !cart ||
            !Array.isArray(cart.lineItems) ||
            cart.lineItems.length === 0
        )
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        if (!addressId) throw new BadRequestError('Không tìm thấy địa chỉ');
        if (!shippingMethodId)
            throw new BadRequestError('Phương thức vận chuyển là bắt buộc');

        // Fetch active cart from BE and compare with FE cart
        const beCart = await database.Cart.findOne({
            where: { id: cart.id, user_id: userId, status: 'active' },
            include: [{ model: database.CartLineItem, as: 'lineItems' }],
        });

        if (!beCart)
            throw new NotFoundError('Không tìm thấy giỏ hàng hoạt động');

        // So sánh giỏ hàng FE với giỏ hàng BE
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

        // Calculate initial subtotal
        const initialSubtotal = totalAmount - Number(shippingFee);

        // Process coupon discount
        const orderData = {
            subtotal: initialSubtotal,
            shippingFee: shippingFee,
            items: beCart.lineItems,
        };

        const couponDiscount = await OrderService.processCouponDiscount(
            userId,
            couponCode,
            orderData,
        );

        // Calculate final totals
        const orderTotals = OrderService.calculateOrderTotals(
            beCart.lineItems,
            shippingFee,
            couponDiscount,
        );

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
                    coupon_codes: couponDiscount.appliedCoupon
                        ? [couponDiscount.appliedCoupon.code]
                        : null,
                    note,
                    ordered_date: orderedDate,
                    shipping_method_id: shippingMethodId,
                    shipping_fee:
                        paymentMethod === 'momo'
                            ? orderTotals.final_shipping_fee
                            : shippingFee,
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
            if (couponDiscount.appliedCoupon) {
                try {
                    await CouponService.applyCouponToOrder(
                        order.id,
                        couponDiscount.appliedCoupon.id,
                        couponDiscount.orderCouponData,
                        transaction,
                    );
                    order.total_amount =
                        order.total_amount - couponDiscount.discountAmount;
                    order.discount_amount = couponDiscount.discountAmount;
                } catch (err) {
                    console.error('Error when applyCouponToOrder:', err);
                    throw err;
                }
            }

            await OrderService.updateProductStock(
                beCart.lineItems,
                transaction,
            );
            beCart.status = 'ordered';
            await beCart.save({ transaction });

            // Tạo payment
            let payment, momoPaymentResult;
            if (paymentMethod === 'momo') {
                // MoMo: gọi API và lưu payment
                const momoOrderId = `ORDER_${order.id}_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
                momoPaymentResult = await MomoPaymentService.createPayment({
                    orderId: order.id,
                    momoOrderId: momoOrderId,
                    amount: Math.round(order.total_amount),
                    orderInfo,
                    extraData,
                    internalOrderId: order.id.toString(),
                });
                payment = await database.Payment.create(
                    {
                        order_id: momoPaymentResult.payment.order_id,
                        payment_method: 'momo',
                        transaction_id:
                            momoPaymentResult.payment.transaction_id,
                        transaction_code: null,
                        status: 'pending',
                        amount: momoPaymentResult.payment.amount,
                        gateway_response:
                            momoPaymentResult.payment.gateway_response || '',
                    },
                    { transaction },
                );
            } else {
                // COD
                payment = await database.Payment.create(
                    {
                        order_id: order.id,
                        amount: order.total_amount,
                        status: 'pending',
                    },
                    { transaction },
                );
            }

            order.payment_id = payment.id;
            await order.save({ transaction });

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
                        createdOrder.user.user_nickname ||
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

            if (paymentMethod === 'momo') {
                return {
                    order: toCamel(createdOrder.toJSON()),
                    momoPayment: momoPaymentResult,
                };
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
}

module.exports = OrderService;
