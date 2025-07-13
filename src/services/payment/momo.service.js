'use strict';

const crypto = require('crypto');
const https = require('https');
const momoConfig = require('../../configs/momo.config');
const {
    BadRequestError,
    InternalServerError,
} = require('../../core/error.response');
const database = require('../../models');

class MomoPaymentService {
    /**
     * Create MoMo payment request
     * @param {Object} paymentData - Payment data
     * @param {string} paymentData.orderId - MoMo Order ID (can be different from internal order ID)
     * @param {number} paymentData.amount - Payment amount
     * @param {string} paymentData.orderInfo - Order information
     * @param {string} paymentData.extraData - Extra data (optional)
     * @param {string} paymentData.internalOrderId - Internal order ID for mapping (optional)
     * @returns {Object} Payment URL and request data
     */
    static async createPayment({
        orderId,
        amount,
        orderInfo = 'Thanh toán đơn hàng',
        extraData = '',
        internalOrderId = null,
    }) {
        try {
            // Validate input
            if (!orderId || !amount) {
                throw new BadRequestError('orderId and amount are required');
            }

            // Generate request data
            const requestId = orderId + '_' + new Date().getTime();

            // Create raw signature string
            const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;

            // Create signature
            const signature = crypto
                .createHmac('sha256', momoConfig.secretKey)
                .update(rawSignature)
                .digest('hex');

            // Create request body
            const requestBody = {
                partnerCode: momoConfig.partnerCode,
                partnerName: momoConfig.partnerName,
                storeId: momoConfig.storeId,
                requestId: requestId,
                amount: amount.toString(),
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: momoConfig.redirectUrl,
                ipnUrl: momoConfig.ipnUrl,
                lang: momoConfig.lang,
                requestType: momoConfig.requestType,
                autoCapture: momoConfig.autoCapture,
                extraData: extraData,
                orderGroupId: momoConfig.orderGroupId,
                signature: signature,
            };

            // Send request to MoMo
            const response = await this.sendMoMoRequest(requestBody);

            // Store payment record
            await this.storePaymentRecord({
                momoOrderId: orderId,
                internalOrderId: internalOrderId || orderId, // Use internal order ID for database mapping
                requestId,
                amount,
                signature,
                rawSignature,
                requestBody: JSON.stringify(requestBody),
                response: JSON.stringify(response),
            });

            return {
                payUrl: response.payUrl,
                deeplink: response.deeplink,
                qrCodeUrl: response.qrCodeUrl,
                orderId: orderId,
                requestId: requestId,
                amount: amount,
            };
        } catch (error) {
            console.error('MoMo payment creation error:', error);
            throw new InternalServerError('Failed to create MoMo payment');
        }
    }

    /**
     * Send request to MoMo API
     * @param {Object} requestBody - Request body
     * @returns {Promise<Object>} MoMo response
     */
    static async sendMoMoRequest(requestBody) {
        return new Promise((resolve, reject) => {
            const requestBodyString = JSON.stringify(requestBody);

            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBodyString),
                },
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.resultCode === 0) {
                            resolve(response);
                        } else {
                            reject(
                                new Error(
                                    `MoMo API Error: ${response.message}`,
                                ),
                            );
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse MoMo response'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request error: ${error.message}`));
            });

            req.write(requestBodyString);
            req.end();
        });
    }

    /**
     * Verify MoMo callback signature
     * @param {Object} callbackData - Callback data from MoMo
     * @returns {boolean} Is signature valid
     */
    static verifySignature(callbackData) {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature,
        } = callbackData;

        // Create raw signature string for verification
        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        // Create expected signature
        const expectedSignature = crypto
            .createHmac('sha256', momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Handle MoMo IPN (Instant Payment Notification)
     * @param {Object} ipnData - IPN data from MoMo
     * @returns {Object} Processing result
     */
    static async handleIPN(ipnData) {
        try {
            // Verify signature
            if (!this.verifySignature(ipnData)) {
                throw new BadRequestError('Invalid signature');
            }

            const {
                orderId: momoOrderId,
                resultCode,
                transId,
                amount,
                message,
            } = ipnData;

            // Find the internal order ID from the MoMo order ID
            const payment = await database.Payment.findOne({
                where: {
                    payment_method: 'momo',
                },
                order: [['created_at', 'DESC']], // Get latest payment record
            });

            let internalOrderId = null;
            if (payment && payment.gateway_response) {
                try {
                    const gatewayData = JSON.parse(payment.gateway_response);
                    if (gatewayData.momoOrderId === momoOrderId) {
                        internalOrderId = payment.order_id;
                    }
                } catch (parseError) {
                    console.error(
                        'Error parsing gateway response:',
                        parseError,
                    );
                }
            }

            // If we can't find the mapping, extract from MoMo order ID pattern
            if (!internalOrderId && momoOrderId.startsWith('ORDER_')) {
                const parts = momoOrderId.split('_');
                if (parts.length >= 2) {
                    internalOrderId = parts[1]; // Extract order ID from ORDER_{id}_{timestamp}_{random}
                }
            }

            if (!internalOrderId) {
                throw new BadRequestError(
                    'Cannot map MoMo order ID to internal order ID',
                );
            }

            // Update payment record
            await this.updatePaymentRecord({
                orderId: internalOrderId,
                momoOrderId: momoOrderId,
                resultCode,
                transId,
                amount,
                ipnData: JSON.stringify(ipnData),
                message,
            });

            // Handle different result codes
            const paymentStatus =
                this.getPaymentStatusFromResultCode(resultCode);
            await this.updateOrderStatus(
                internalOrderId,
                paymentStatus,
                resultCode,
                message,
            );

            return {
                resultCode: 0,
                message: 'Success',
            };
        } catch (error) {
            console.error('MoMo IPN handling error:', error);
            return {
                resultCode: 1,
                message: 'Error processing IPN',
            };
        }
    }

    /**
     * Get payment status from MoMo result code
     * @param {number} resultCode - MoMo result code
     * @returns {string} Payment status
     */
    static getPaymentStatusFromResultCode(resultCode) {
        switch (resultCode) {
            case 0:
                return 'completed'; // Success
            case 9000:
                return 'cancelled'; // User cancelled
            case 8000:
                return 'expired'; // Payment expired
            case 7000:
                return 'failed'; // Payment failed
            case 6000:
                return 'failed'; // Insufficient balance
            case 5000:
                return 'failed'; // Invalid transaction
            case 4000:
                return 'failed'; // Transaction limit exceeded
            case 3000:
                return 'failed'; // System error
            case 2000:
                return 'cancelled'; // Transaction cancelled by user
            case 1000:
                return 'failed'; // General error
            default:
                return 'failed'; // Unknown error
        }
    }

    /**
     * Get user-friendly message from MoMo result code
     * @param {number} resultCode - MoMo result code
     * @returns {string} User-friendly message
     */
    static getMessageFromResultCode(resultCode) {
        switch (resultCode) {
            // Success
            case 0:
                return 'Thanh toán thành công';

            // Pending statuses
            case 1000:
                return 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán';
            case 7000:
                return 'Giao dịch đang được xử lý';
            case 7002:
                return 'Giao dịch đang được xử lý bởi nhà cung cấp thanh toán';
            case 9000:
                return 'Giao dịch đã được xác nhận thành công';

            // Expired/Timeout
            case 1005:
                return 'Giao dịch thất bại do URL hoặc QR code đã hết hạn';

            // Cancelled
            case 1003:
                return 'Giao dịch đã bị hủy';
            case 1006:
                return 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán';
            case 1017:
                return 'Giao dịch bị hủy bởi đối tác';

            // User errors
            case 1001:
                return 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền';
            case 1002:
                return 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán';
            case 1004:
                return 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng';
            case 1007:
                return 'Giao dịch bị từ chối vì tài khoản không tồn tại hoặc đang ở trạng thái ngưng hoạt động';
            case 4001:
                return 'Giao dịch bị từ chối do tài khoản người dùng đang bị hạn chế';
            case 4002:
                return 'Giao dịch bị từ chối do tài khoản người dùng chưa được xác thực với C06';
            case 4100:
                return 'Giao dịch thất bại do người dùng không đăng nhập thành công';

            // System errors
            case 10:
                return 'Hệ thống đang được bảo trì';
            case 11:
                return 'Truy cập bị từ chối';
            case 12:
                return 'Phiên bản API không được hỗ trợ cho yêu cầu này';
            case 47:
                return 'Yêu cầu bị từ chối vì thông tin không hợp lệ trong danh sách dữ liệu khả dụng';
            case 98:
                return 'QR Code tạo không thành công. Vui lòng thử lại sau';
            case 99:
                return 'Lỗi không xác định';
            case 1026:
                return 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi';
            case 2019:
                return 'Yêu cầu bị từ chối vì orderGroupId không hợp lệ';

            // Merchant errors
            case 13:
                return 'Xác thực doanh nghiệp thất bại';
            case 20:
                return 'Yêu cầu sai định dạng';
            case 21:
                return 'Yêu cầu bị từ chối vì số tiền giao dịch không hợp lệ';
            case 22:
                return 'Số tiền giao dịch không hợp lệ';
            case 40:
                return 'RequestId bị trùng';
            case 41:
                return 'OrderId bị trùng';
            case 42:
                return 'OrderId không hợp lệ hoặc không được tìm thấy';
            case 43:
                return 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch';
            case 45:
                return 'Trùng ItemId';

            // Refund errors
            case 1080:
                return 'Giao dịch hoàn tiền thất bại trong quá trình xử lý';
            case 1081:
                return 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu có thể đã được hoàn';
            case 1088:
                return 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu không được hỗ trợ hoàn tiền';

            default:
                return 'Lỗi không xác định';
        }
    }

    /**
     * Store payment record in database
     * @param {Object} paymentData - Payment data to store
     */
    static async storePaymentRecord(paymentData) {
        try {
            await database.Payment.create({
                order_id: paymentData.internalOrderId, // Use internal order ID for database
                payment_method: 'momo',
                amount: paymentData.amount,
                status: 'pending',
                transaction_id: paymentData.requestId,
                gateway_response: JSON.stringify({
                    momoOrderId: paymentData.momoOrderId, // Store MoMo order ID for reference
                    response: paymentData.response,
                    requestBody: paymentData.requestBody,
                }),
                created_at: new Date(),
            });
        } catch (error) {
            console.error('Error storing payment record:', error);
            // Don't throw error here to avoid breaking payment flow
        }
    }

    /**
     * Update payment record after callback
     * @param {Object} updateData - Update data
     */
    static async updatePaymentRecord(updateData) {
        try {
            const status = updateData.resultCode === 0 ? 'completed' : 'failed';

            // Update the payment record with additional MoMo data
            const gatewayResponse = {
                momoOrderId: updateData.momoOrderId,
                ipnData: updateData.ipnData,
                transactionId: updateData.transId,
                resultCode: updateData.resultCode,
            };

            await database.Payment.update(
                {
                    status: status,
                    transaction_id: updateData.transId,
                    gateway_response: JSON.stringify(gatewayResponse),
                    updated_at: new Date(),
                },
                {
                    where: {
                        order_id: updateData.orderId,
                        payment_method: 'momo',
                    },
                },
            );
        } catch (error) {
            console.error('Error updating payment record:', error);
        }
    }

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} paymentStatus - Payment status
     * @param {number} resultCode - MoMo result code
     * @param {string} message - MoMo message
     */
    static async updateOrderStatus(
        orderId,
        paymentStatus,
        resultCode = null,
        message = null,
    ) {
        try {
            if (paymentStatus === 'completed') {
                // Complete the order payment process
                const OrderService = require('../order/order.service');
                await OrderService.completeOrderPayment(orderId);
            } else {
                // Handle different failure/cancellation cases
                let orderStatus = 'payment_failed';
                let updateData = {
                    updated_at: new Date(),
                };

                switch (paymentStatus) {
                    case 'expired':
                        orderStatus = 'payment_expired';
                        updateData.note =
                            (updateData.note ? updateData.note + ' | ' : '') +
                            `Thanh toán hết hạn lúc ${new Date().toLocaleString('vi-VN')}`;
                        break;
                    case 'cancelled':
                        orderStatus = 'payment_cancelled';
                        updateData.note =
                            (updateData.note ? updateData.note + ' | ' : '') +
                            `Thanh toán bị hủy lúc ${new Date().toLocaleString('vi-VN')}`;
                        break;
                    case 'failed':
                    default:
                        orderStatus = 'payment_failed';
                        updateData.note =
                            (updateData.note ? updateData.note + ' | ' : '') +
                            `Thanh toán thất bại lúc ${new Date().toLocaleString('vi-VN')}` +
                            (message ? ` - ${message}` : '');
                        break;
                }

                updateData.status = orderStatus;

                await database.Order.update(updateData, {
                    where: { id: orderId },
                });

                // For expired/cancelled payments, we should restore product stock
                if (
                    paymentStatus === 'expired' ||
                    paymentStatus === 'cancelled'
                ) {
                    await this.restoreProductStock(orderId);
                }
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }

    /**
     * Restore product stock for cancelled/expired orders
     * @param {string} orderId - Order ID
     */
    static async restoreProductStock(orderId) {
        try {
            // Get order with line items
            const order = await database.Order.findOne({
                where: { id: orderId },
                include: [{ model: database.OrderLineItem, as: 'lineItems' }],
            });

            if (!order || !order.lineItems) {
                return;
            }

            // Restore stock for each product in the order
            const transaction = await database.sequelize.transaction();
            try {
                for (const item of order.lineItems) {
                    const product = await database.Product.findByPk(
                        item.product_id,
                        { transaction },
                    );

                    if (product) {
                        product.stock =
                            Number(product.stock) + Number(item.quantity);

                        // Update inventory type based on new stock level
                        if (product.stock > (product.min_stock || 0)) {
                            product.inventory_type = 'in_stock';
                        } else if (product.stock > 0) {
                            product.inventory_type = 'low_stock';
                        }

                        await product.save({ transaction });
                    }
                }

                await transaction.commit();
                console.log(`Stock restored for order ${orderId}`);
            } catch (error) {
                await transaction.rollback();
                console.error(
                    `Error restoring stock for order ${orderId}:`,
                    error,
                );
            }
        } catch (error) {
            console.error('Error in restoreProductStock:', error);
        }
    }

    /**
     * Get payment status
     * @param {string} orderId - Order ID
     * @returns {Object} Payment status
     */
    static async getPaymentStatus(orderId) {
        try {
            const payment = await database.Payment.findOne({
                where: {
                    order_id: orderId,
                    payment_method: 'momo',
                },
            });

            if (!payment) {
                throw new BadRequestError('Payment not found');
            }

            return {
                orderId: payment.order_id,
                amount: payment.amount,
                status: payment.status,
                transactionId: payment.transaction_id,
                createdAt: payment.created_at,
            };
        } catch (error) {
            console.error('Error getting payment status:', error);
            throw new InternalServerError('Failed to get payment status');
        }
    }

    /**
     * Check and handle expired payments
     * This method should be called periodically (e.g., every 5 minutes)
     */
    static async checkExpiredPayments() {
        try {
            const momoConfig = require('../../configs/momo.config');
            const expirationTime = new Date();
            expirationTime.setMinutes(
                expirationTime.getMinutes() -
                    momoConfig.paymentExpirationMinutes,
            );

            // Find pending payments that are older than expiration time
            const expiredPayments = await database.Payment.findAll({
                where: {
                    payment_method: 'momo',
                    status: 'pending',
                    created_at: {
                        [database.Sequelize.Op.lt]: expirationTime,
                    },
                },
                include: [
                    {
                        model: database.Order,
                        as: 'order',
                        where: {
                            status: 'pending_payment',
                        },
                    },
                ],
            });

            console.log(
                `Found ${expiredPayments.length} expired MoMo payments`,
            );

            for (const payment of expiredPayments) {
                await this.handlePaymentExpiration(payment);
            }

            return {
                processed: expiredPayments.length,
                message: `Processed ${expiredPayments.length} expired payments`,
            };
        } catch (error) {
            console.error('Error checking expired payments:', error);
            return {
                processed: 0,
                error: error.message,
            };
        }
    }

    /**
     * Handle individual payment expiration
     * @param {Object} payment - Payment record
     */
    static async handlePaymentExpiration(payment) {
        try {
            // Update payment status to expired
            await database.Payment.update(
                {
                    status: 'expired',
                    gateway_response: JSON.stringify({
                        ...JSON.parse(payment.gateway_response || '{}'),
                        expiredAt: new Date(),
                        expiredReason: 'Payment timeout',
                    }),
                    updated_at: new Date(),
                },
                {
                    where: { id: payment.id },
                },
            );

            // Update order status and restore stock
            await this.updateOrderStatus(
                payment.order_id,
                'expired',
                8000,
                'Payment expired due to timeout',
            );

            console.log(`Payment expired for order ${payment.order_id}`);
        } catch (error) {
            console.error(
                `Error handling payment expiration for order ${payment.order_id}:`,
                error,
            );
        }
    }

    /**
     * Get payment expiration status
     * @param {string} orderId - Order ID
     * @returns {Object} Expiration status
     */
    static async getPaymentExpirationStatus(orderId) {
        try {
            const payment = await database.Payment.findOne({
                where: {
                    order_id: orderId,
                    payment_method: 'momo',
                },
                order: [['created_at', 'DESC']],
            });

            if (!payment) {
                return {
                    found: false,
                    message: 'Payment not found',
                };
            }

            const momoConfig = require('../../configs/momo.config');
            const createdAt = new Date(payment.created_at);
            const expirationTime = new Date(
                createdAt.getTime() +
                    momoConfig.paymentExpirationMinutes * 60 * 1000,
            );
            const now = new Date();
            const isExpired = now > expirationTime;
            const timeLeft = Math.max(
                0,
                Math.floor((expirationTime - now) / 1000),
            ); // seconds

            return {
                found: true,
                isExpired,
                timeLeft,
                timeLeftFormatted: this.formatTimeLeft(timeLeft),
                expirationTime,
                status: payment.status,
                paymentId: payment.id,
            };
        } catch (error) {
            console.error('Error getting payment expiration status:', error);
            return {
                found: false,
                error: error.message,
            };
        }
    }

    /**
     * Format time left in human-readable format
     * @param {number} seconds - Seconds left
     * @returns {string} Formatted time
     */
    static formatTimeLeft(seconds) {
        if (seconds <= 0) return '00:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Cancel pending payment manually
     * @param {string} orderId - Order ID
     * @param {string} reason - Cancellation reason
     * @returns {Object} Cancellation result
     */
    static async cancelPayment(orderId, reason = 'Manual cancellation') {
        try {
            const payment = await database.Payment.findOne({
                where: {
                    order_id: orderId,
                    payment_method: 'momo',
                    status: 'pending',
                },
            });

            if (!payment) {
                return {
                    success: false,
                    message: 'Pending payment not found',
                };
            }

            // Update payment status
            await database.Payment.update(
                {
                    status: 'cancelled',
                    gateway_response: JSON.stringify({
                        ...JSON.parse(payment.gateway_response || '{}'),
                        cancelledAt: new Date(),
                        cancelledReason: reason,
                    }),
                    updated_at: new Date(),
                },
                {
                    where: { id: payment.id },
                },
            );

            // Update order status and restore stock
            await this.updateOrderStatus(orderId, 'cancelled', 9000, reason);

            return {
                success: true,
                message: 'Payment cancelled successfully',
                orderId,
            };
        } catch (error) {
            console.error('Error cancelling payment:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Check for expired payments and update their status
     * MoMo payments typically expire after 15 minutes
     * @param {number} expirationMinutes - Minutes after which payments expire (default: 15)
     * @returns {Object} Cleanup result
     */
    static async checkExpiredPayments(expirationMinutes = 15) {
        try {
            const expirationTime = new Date(
                Date.now() - expirationMinutes * 60 * 1000,
            );

            // Find pending MoMo payments older than expiration time
            const expiredPayments = await database.Payment.findAll({
                where: {
                    payment_method: 'momo',
                    status: 'pending',
                    created_at: {
                        [database.Sequelize.Op.lt]: expirationTime,
                    },
                },
                include: [
                    {
                        model: database.Order,
                        as: 'order',
                        where: {
                            status: 'pending_payment',
                        },
                    },
                ],
            });

            const updatedCount = expiredPayments.length;

            // Update expired payments and orders
            for (const payment of expiredPayments) {
                await this.updatePaymentRecord({
                    orderId: payment.order_id,
                    momoOrderId: 'EXPIRED_' + payment.order_id,
                    resultCode: 1005, // URL or QR code expired
                    transId: null,
                    amount: payment.amount,
                    ipnData: JSON.stringify({
                        resultCode: 1005,
                        message: 'Payment expired due to timeout',
                        expiredAt: new Date().toISOString(),
                    }),
                    message: 'Payment expired due to timeout',
                });

                await this.updateOrderStatus(
                    payment.order_id,
                    'expired',
                    1005,
                    'Payment expired',
                );
            }

            return {
                success: true,
                expiredCount: updatedCount,
                message: `Updated ${updatedCount} expired payments`,
            };
        } catch (error) {
            console.error('Error checking expired payments:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

module.exports = MomoPaymentService;
