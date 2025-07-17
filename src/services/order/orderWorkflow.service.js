'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');
const EmailService = require('../email/email.service');
const MomoPaymentService = require('../payment/momo.service');
const OrderLogService = require('./orderLog.service');

/**
 * Service xử lý workflow đơn hàng theo quy tắc:
 *
 * 🔄 COD (Thanh toán khi nhận hàng):
 * pending_confirmation → pending_pickup → shipping → delivered → [payment completed]
 *
 * 🔄 MoMo (Thanh toán trước):
 * pending_confirmation → [payment completed] → pending_pickup → shipping → delivered
 *
 * 🚨 Refund/Trả hàng:
 * shipping/delivered → returned → [payment refunded if needed]
 */
class OrderWorkflowService {
    /**
     * Xác nhận đơn hàng
     * - COD: pending_confirmation → pending_pickup
     * - MoMo: pending_confirmation → pending_pickup (chỉ khi đã thanh toán)
     */
    static async confirmOrder(
        orderId,
        actorId = null,
        actorName = null,
        note = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
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
        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        const fromStatus = order.status;
        if (fromStatus !== 'pending_confirmation') {
            throw new BadRequestError('Đơn hàng không thể xác nhận');
        }

        // Kiểm tra điều kiện thanh toán
        if (order.payment && order.payment.payment_method === 'momo') {
            if (order.payment.status !== 'completed') {
                throw new BadRequestError(
                    'Đơn hàng MoMo chưa thanh toán không thể xác nhận',
                );
            }

            // Nếu đã thanh toán nhưng chưa có log thanh toán thì thêm log thủ công
            const paymentLog = await database.OrderLog.findOne({
                where: {
                    order_id: order.id,
                    action: 'payment_completed',
                },
            });
            if (!paymentLog) {
                ('Them paymen log thanh toan thu cong');
                await OrderLogService.createLog({
                    orderId: order.id,
                    fromStatus: 'pending_confirmation',
                    toStatus: 'pending_confirmation',
                    action: 'payment_completed',
                    actorType: 'system',
                    note: 'Thêm log thanh toán thủ công do thiếu IPN',
                });
            }
        }

        const transaction = await database.sequelize.transaction();
        try {
            // Cập nhật trạng thái
            order.status = 'pending_pickup';
            await order.save({ transaction });
            // Tạo log
            await OrderLogService.createLog({
                orderId,
                fromStatus,
                toStatus: 'pending_pickup',
                action: 'confirmed',
                actorType: 'admin',
                actorId,
                actorName,
                note,
                ipAddress,
                userAgent,
                transaction, // Truyền transaction vào
            });

            await transaction.commit();
            // Send order confirmation email
            try {
                if (order.user && order.user.user_email) {
                    await EmailService.sendOrderConfirmationEmail(
                        order.user.user_email,
                        order.user.user_nickname || order.user.user_login,
                        order,
                        true,
                    );
                }
            } catch (emailError) {
                console.error(
                    'Failed to send order confirmation email:',
                    emailError,
                );
                // Don't throw error - email failure shouldn't break order creation
            }

            // Reload order để có dữ liệu mới nhất sau commit
            await order.reload();
            return order;
        } catch (error) {
            // Chỉ rollback nếu transaction chưa được commit/rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Shipper lấy hàng
     * pending_pickup → shipping
     */
    static async pickupOrder(
        orderId,
        trackingNumber = null,
        shippedBy = null,
        actorId = null,
        actorName = null,
        note = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [
                {
                    model: database.User,
                    as: 'user',
                    attributes: [
                        'id',
                        'user_login',
                        'user_email',
                        'user_nickname',
                    ],
                },
            ],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        const fromStatus = order.status;
        if (fromStatus !== 'pending_pickup') {
            throw new BadRequestError('Đơn hàng không thể lấy hàng');
        }

        const transaction = await database.sequelize.transaction();
        try {
            // Cập nhật trạng thái và thông tin giao hàng
            order.status = 'shipping';
            order.shipped_date = new Date();
            if (trackingNumber) order.tracking_number = trackingNumber;
            if (shippedBy) order.shipped_by = shippedBy;
            await order.save({ transaction });

            // Tạo log
            await OrderLogService.createLog({
                orderId,
                fromStatus,
                toStatus: 'shipping',
                action: 'picked_up',
                actorType: 'shipper',
                actorId,
                actorName: shippedBy || actorName,
                note,
                metadata: {
                    tracking_number: trackingNumber,
                    shipped_by: shippedBy,
                },
                ipAddress,
                userAgent,
                transaction, // Thêm transaction
            });

            await transaction.commit();

            // Reload order để có dữ liệu mới nhất sau commit
            await order.reload();

            // Gửi email thông báo vận chuyển
            if (order.user && order.user.user_email) {
                try {
                    await EmailService.sendOrderStatusUpdateEmail(
                        order.user.user_email,
                        order.user.user_nickname || order.user.user_login,
                        order,
                        'shipping',
                    );
                    console.log(
                        `Shipping email sent to ${order.user.user_email} for order ${order.id}`,
                    );
                } catch (emailError) {
                    console.error('Failed to send shipping email:', emailError);
                    // Không throw error để không ảnh hưởng đến flow chính
                }
            }

            return order;
        } catch (error) {
            // Chỉ rollback nếu transaction chưa được commit/rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Giao hàng thành công (shipper xác nhận)
     * shipping → delivered
     */
    static async deliverOrder(
        orderId,
        actorId = null,
        actorName = null,
        note = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [
                {
                    model: database.Payment,
                    as: 'payment',
                },
                {
                    model: database.User,
                    as: 'user',
                    attributes: [
                        'id',
                        'user_login',
                        'user_email',
                        'user_nickname',
                    ],
                },
            ],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        const fromStatus = order.status;
        if (fromStatus !== 'shipping') {
            throw new BadRequestError('Đơn hàng không thể giao');
        }

        const transaction = await database.sequelize.transaction();
        try {
            // Cập nhật trạng thái đơn hàng
            order.status = 'delivered';
            order.delivered_date = new Date();
            await order.save({ transaction });

            // Tạo log
            await OrderLogService.createLog({
                orderId,
                fromStatus,
                toStatus: 'delivered',
                action: 'delivered',
                actorType: 'shipper',
                actorId,
                actorName,
                note,
                ipAddress,
                userAgent,
                transaction, // Thêm transaction
            });

            await transaction.commit();

            // Reload order để có dữ liệu mới nhất sau commit
            await order.reload();

            // // Gửi email thông báo giao hàng thành công
            // if (order.user && order.user.user_email) {
            //     try {
            //         await EmailService.sendOrderStatusUpdateEmail(
            //             order.user.user_email,
            //             order.user.user_nickname || order.user.user_login,
            //             order,
            //             'delivered',
            //         );
            //         console.log(
            //             `Delivery email sent to ${order.user.user_email} for order ${order.id}`,
            //         );
            //     } catch (emailError) {
            //         console.error('Failed to send delivery email:', emailError);
            //         // Không throw error để không ảnh hưởng đến flow chính
            //     }
            // }

            return order;
        } catch (error) {
            // Chỉ rollback nếu transaction chưa được commit/rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Shipper nộp tiền COD
     * Chỉ cho COD: delivered → payment completed
     */
    static async completeCODPayment(
        orderId,
        actorId = null,
        actorName = null,
        note = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [{ model: database.Payment, as: 'payment' }],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        if (order.status !== 'delivered') {
            throw new BadRequestError(
                'Đơn hàng chưa giao không thể thu tiền COD',
            );
        }

        if (!order.payment || order.payment.payment_method !== 'cash') {
            throw new BadRequestError('Đơn hàng không phải COD');
        }

        if (order.payment.status === 'completed') {
            throw new BadRequestError('Đơn hàng đã thu tiền rồi');
        }

        // Cập nhật trạng thái thanh toán
        order.payment.status = 'completed';
        order.payment.paid_at = new Date();
        await order.payment.save();

        // Thêm log cho hoàn tất COD
        await OrderLogService.createLog({
            orderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            action: 'cod_completed',
            actorType: actorId ? 'admin' : 'system',
            actorId,
            actorName,
            note,
            metadata: {
                payment_method: 'cash',
                amount: order.payment.amount,
            },
            ipAddress,
            userAgent,
        });

        // Reload order để có dữ liệu mới nhất
        await order.reload();
        return order;
    }

    /**
     * Trả hàng / Không nhận hàng
     * shipping/delivered → returned
     * Tự động xử lý refund nếu cần
     */
    static async returnOrder(
        orderId,
        reason = null,
        actorId = null,
        actorName = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [{ model: database.Payment, as: 'payment' }],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        if (!['shipping', 'delivered'].includes(order.status)) {
            throw new BadRequestError('Đơn hàng không thể trả hàng');
        }

        const transaction = await database.sequelize.transaction();
        try {
            // Cập nhật trạng thái đơn hàng
            const fromStatus = order.status;
            order.status = 'returned';
            if (reason)
                order.note = (order.note || '') + `\nLý do trả hàng: ${reason}`;
            await order.save({ transaction });

            // Tạo log trả hàng
            await OrderLogService.createLog({
                orderId: order.id,
                fromStatus,
                toStatus: 'returned',
                action: 'returned',
                actorType: actorId ? 'customer' : 'admin',
                actorId,
                actorName,
                note: reason,
                ipAddress,
                userAgent,
                transaction,
            });

            // Xử lý refund nếu đã thanh toán
            if (order.payment && order.payment.status === 'completed') {
                if (order.payment.payment_method === 'momo') {
                    // Refund MoMo
                    try {
                        await MomoPaymentService.refundTransaction(
                            order.payment.transaction_id,
                            order.payment.amount,
                            `Hoàn tiền đơn hàng ${order.id} - ${reason || 'Trả hàng'}`,
                        );

                        order.payment.status = 'refunded';
                        await order.payment.save({ transaction });

                        // Log refund
                        await OrderLogService.createLog({
                            orderId: order.id,
                            fromStatus: 'returned',
                            toStatus: 'returned',
                            action: 'refunded',
                            actorType: 'system',
                            note: 'Hoàn tiền MoMo khi trả hàng',
                            metadata: {
                                refund_amount: order.payment.amount,
                                payment_method: 'momo',
                            },
                            transaction,
                        });
                    } catch (refundError) {
                        console.error('MoMo refund failed:', refundError);
                        throw new BadRequestError('Hoàn tiền MoMo thất bại');
                    }
                } else if (order.payment.payment_method === 'cash') {
                    // COD đã thu tiền thì đánh dấu cần hoàn tiền thủ công
                    order.payment.status = 'refunded';
                    await order.payment.save({ transaction });

                    // Log refund
                    await OrderLogService.createLog({
                        orderId: order.id,
                        fromStatus: 'returned',
                        toStatus: 'returned',
                        action: 'refunded',
                        actorType: 'system',
                        note: 'Hoàn tiền COD khi trả hàng',
                        metadata: {
                            refund_amount: order.payment.amount,
                            payment_method: 'cash',
                        },
                        transaction,
                    });
                }
            }

            // Hoàn lại stock sản phẩm
            const orderItems = await database.OrderLineItem.findAll({
                where: { order_id: order.id },
                transaction,
            });

            for (const item of orderItems) {
                const product = await database.Product.findByPk(
                    item.product_id,
                    { transaction },
                );
                if (product) {
                    product.stock =
                        Number(product.stock) + Number(item.quantity);
                    product.sold = Math.max(
                        0,
                        Number(product.sold || 0) - Number(item.quantity),
                    );

                    // Cập nhật inventory_type
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

            await transaction.commit();

            // Reload order để có dữ liệu mới nhất sau commit
            await order.reload();
            return order;
        } catch (error) {
            // Chỉ rollback nếu transaction chưa được commit/rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Hủy đơn hàng
     * pending_confirmation/pending_pickup → cancelled
     */
    static async cancelOrder(
        orderId,
        reason = null,
        actorId = null,
        actorName = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [
                {
                    model: database.Payment,
                    as: 'payment',
                },
                {
                    model: database.User,
                    as: 'user',
                    attributes: [
                        'id',
                        'user_login',
                        'user_email',
                        'user_nickname',
                    ],
                },
            ],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        if (
            !['pending_confirmation', 'pending_pickup'].includes(order.status)
        ) {
            throw new BadRequestError('Đơn hàng không thể hủy');
        }

        const transaction = await database.sequelize.transaction();
        try {
            // Cập nhật trạng thái đơn hàng
            const fromStatus = order.status;
            order.status = 'cancelled';
            if (reason)
                order.note = (order.note || '') + `\nLý do hủy: ${reason}`;
            await order.save({ transaction });

            // Xác định actorType: admin hay customer
            let actorType = 'admin';
            if (actorId && order.user && order.user.id === actorId) {
                actorType = 'customer';
            }

            // Tạo log hủy đơn
            await OrderLogService.createLog({
                orderId: order.id,
                fromStatus,
                toStatus: 'cancelled',
                action: 'cancelled',
                actorType,
                actorId,
                actorName,
                note: reason,
                ipAddress,
                userAgent,
                transaction,
            });

            // Xử lý payment
            if (order.payment) {
                if (
                    order.payment.status === 'completed' &&
                    order.payment.payment_method === 'momo'
                ) {
                    // Refund MoMo nếu đã thanh toán
                    // try {
                    //     await MomoPaymentService.refundTransaction(
                    //         order.payment.transaction_id,
                    //         order.payment.amount,
                    //         `Hoàn tiền hủy đơn ${order.id} - ${reason || 'Hủy đơn'}`,
                    //     );
                    //     order.payment.status = 'refunded';
                    // } catch (refundError) {
                    //     console.error('MoMo refund failed:', refundError);
                    //     order.payment.status = 'failed';
                    // }
                    order.payment.status = 'cancelled';
                } else {
                    order.payment.status = 'cancelled';
                }
                await order.payment.save({ transaction });
            }

            // Hoàn lại stock sản phẩm
            const orderItems = await database.OrderLineItem.findAll({
                where: { order_id: order.id },
                transaction,
            });

            for (const item of orderItems) {
                const product = await database.Product.findByPk(
                    item.product_id,
                    { transaction },
                );
                if (product) {
                    product.stock =
                        Number(product.stock) + Number(item.quantity);
                    product.sold = Math.max(
                        0,
                        Number(product.sold || 0) - Number(item.quantity),
                    );

                    // Cập nhật inventory_type
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

            await transaction.commit();

            // Reload order để có dữ liệu mới nhất sau commit
            await order.reload();

            // Gửi email thông báo hủy đơn hàng
            if (order.user && order.user.user_email) {
                try {
                    await EmailService.sendOrderCancellationEmail(
                        order.user.user_email,
                        order.user.user_nickname || order.user.user_login,
                        order,
                        reason,
                    );
                    console.log(
                        `Cancellation email sent to ${order.user.user_email} for order ${order.id}`,
                    );
                } catch (emailError) {
                    console.error(
                        'Failed to send cancellation email:',
                        emailError,
                    );
                    // Không throw error để không ảnh hưởng đến flow chính
                }
            }

            return order;
        } catch (error) {
            // Chỉ rollback nếu transaction chưa được commit/rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Khách hàng xác nhận đã nhận hàng
     * delivered → customer_confirmed
     */
    static async customerConfirmOrder(
        orderId,
        customerId,
        customerName = null,
        note = null,
        ipAddress = null,
        userAgent = null,
    ) {
        const order = await database.Order.findByPk(orderId, {
            include: [{ model: database.Payment, as: 'payment' }],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        // Kiểm tra quyền sở hữu đơn hàng
        if (order.user_id !== customerId) {
            throw new BadRequestError(
                'Bạn không có quyền xác nhận đơn hàng này',
            );
        }

        const fromStatus = order.status;
        if (fromStatus !== 'delivered') {
            throw new BadRequestError(
                'Đơn hàng chưa được giao không thể xác nhận',
            );
        }

        const transaction = await database.sequelize.transaction();
        try {
            // Cập nhật trạng thái đơn hàng
            order.status = 'customer_confirmed';
            order.customer_confirmed_date = new Date();
            await order.save({ transaction });

            // Tạo log
            await OrderLogService.createLog({
                orderId,
                fromStatus,
                toStatus: 'customer_confirmed',
                action: 'customer_confirmed',
                actorType: 'customer',
                actorId: customerId,
                actorName: customerName,
                note,
                ipAddress,
                userAgent,
                transaction, // Thêm transaction
            });

            // Nếu là COD và chưa thu tiền, tự động đánh dấu đã thu tiền
            if (
                order.payment &&
                order.payment.payment_method === 'cash' &&
                order.payment.status === 'pending'
            ) {
                order.payment.status = 'completed';
                order.payment.paid_at = new Date();
                await order.payment.save({ transaction });

                // Tạo log cho COD completion
                await OrderLogService.createLog({
                    orderId,
                    fromStatus: 'customer_confirmed',
                    toStatus: 'customer_confirmed',
                    action: 'cod_completed',
                    actorType: 'system',
                    note: 'Tự động hoàn tất COD khi khách hàng xác nhận nhận hàng',
                    metadata: {
                        payment_method: 'cash',
                        amount: order.payment.amount,
                    },
                    transaction, // Thêm transaction
                });
            }

            await transaction.commit();

            // Reload order để có dữ liệu mới nhất sau commit
            await order.reload();
            return order;
        } catch (error) {
            // Chỉ rollback nếu transaction chưa được commit/rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Lấy workflow hiện tại và các hành động có thể thực hiện
     */
    static async getOrderWorkflow(orderId, userId) {
        const order = await database.Order.findByPk(orderId, {
            include: [{ model: database.Payment, as: 'payment' }],
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        const foundUser = await database.User.findByPk(userId, {
            include: [{ model: database.Role, as: 'role' }],
        });

        console.log('user ID: -------', userId);
        console.log('foundUser: -------', foundUser);

        if (!foundUser) {
            throw new NotFoundError('Người dùng không tồn tại');
        }

        const workflow = {
            currentStatus: order.status,
            paymentStatus: order.payment?.status || 'pending',
            paymentMethod: order.payment?.payment_method || 'cash',
            availableActions: [],
        };

        // Kiểm tra nếu đã quá 3 ngày kể từ khi giao hàng thì không cho trả hàng
        let canReturn = true;
        if (
            order.status === 'delivered' ||
            order.status === 'customer_confirmed'
        ) {
            const deliveredDate =
                order.delivered_date || order.customer_confirmed_date;
            if (deliveredDate) {
                const now = new Date();
                const diffMs = now - new Date(deliveredDate);
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                if (diffDays > 3) {
                    canReturn = false;
                }
            }
        }

        if (foundUser.role.name === 'admin') {
            // Admin có thể thực hiện tất cả hành động
            // Xác định các hành động có thể thực hiện
            switch (order.status) {
                case 'pending_confirmation':
                    workflow.availableActions = ['confirm', 'cancel'];
                    break;
                case 'pending_pickup':
                    workflow.availableActions = ['pickup', 'cancel'];
                    break;
                case 'shipping':
                    workflow.availableActions = ['deliver', 'return'];
                    break;
                case 'delivered':
                    workflow.availableActions = [];
                    if (
                        order.payment?.payment_method === 'cash' &&
                        order.payment?.status === 'pending'
                    ) {
                        workflow.availableActions.push('complete_cod_payment');
                    }
                    break;
                case 'customer_confirmed':
                    if (canReturn) {
                        workflow.availableActions = ['return']; // Vẫn có thể trả hàng trong thời gian nhất định
                    }
                    break;
                case 'returned':
                case 'cancelled':
                    workflow.availableActions = []; // Không có hành động nào
                    break;
            }
        } else {
            // Xác định các hành động có thể thực hiện
            switch (order.status) {
                case 'pending_confirmation':
                    if (order.payment?.payment_method !== 'momo') {
                        workflow.availableActions = ['cancel'];
                    }
                    break;
                case 'pending_pickup':
                    if (order.payment?.payment_method !== 'momo') {
                        workflow.availableActions = ['cancel'];
                    }
                    break;
                case 'shipping':
                    workflow.availableActions = [];
                    break;
                case 'delivered':
                    if (order.payment?.payment_method !== 'momo') {
                        workflow.availableActions = [
                            'customer_confirm',
                            'return',
                        ];
                    } else {
                        workflow.availableActions = ['customer_confirm'];
                    }
                    if (
                        order.payment?.payment_method === 'cash' &&
                        order.payment?.status === 'pending'
                    ) {
                        workflow.availableActions.push('complete_cod_payment');
                    }
                    break;
                case 'customer_confirmed':
                    workflow.availableActions = ['return']; // Vẫn có thể trả hàng trong thời gian nhất định
                    break;
                case 'returned':
                case 'cancelled':
                    workflow.availableActions = []; // Không có hành động nào
                    break;
            }
        }

        return workflow;
    }

    /**
     * Lấy thống kê đơn hàng theo trạng thái
     */
    static async getOrderStatistics() {
        const orderStats = await database.Order.findAll({
            attributes: [
                'status',
                [
                    database.sequelize.fn(
                        'COUNT',
                        database.sequelize.col('id'),
                    ),
                    'count',
                ],
            ],
            group: ['status'],
        });

        const paymentStats = await database.Payment.findAll({
            attributes: [
                'status',
                'payment_method',
                [
                    database.sequelize.fn(
                        'COUNT',
                        database.sequelize.col('id'),
                    ),
                    'count',
                ],
                [
                    database.sequelize.fn(
                        'SUM',
                        database.sequelize.col('amount'),
                    ),
                    'total_amount',
                ],
            ],
            group: ['status', 'payment_method'],
        });

        return {
            ordersByStatus: orderStats.map((stat) => ({
                status: stat.status,
                count: parseInt(stat.get('count')),
            })),
            paymentsByStatusAndMethod: paymentStats.map((stat) => ({
                status: stat.status,
                method: stat.payment_method,
                count: parseInt(stat.get('count')),
                totalAmount: parseFloat(stat.get('total_amount') || 0),
            })),
        };
    }
}

module.exports = OrderWorkflowService;
