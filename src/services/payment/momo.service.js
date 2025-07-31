'use strict';

const crypto = require('crypto');
const https = require('https');
const momoConfig = require('../../configs/momo.config');
const {
    BadRequestError,
    InternalServerError,
} = require('../../core/error.response');
const database = require('../../models');
const EmailService = require('../email/email.service');
const {
    MOMO_RESULT_CODES,
    MOMO_PAYMENT_STATUS,
    ORDER_STATUS,
    CART_STATUS,
    MOMO_ENDPOINTS,
    MOMO_REQUEST_TYPES,
} = require('../../common/momo.constants');

class MomoPaymentService {
    // ===============================
    // MAIN FUNCTION 1: CREATE PAYMENT
    // ===============================
    /**
     * Create MoMo payment and update cart status
     * @param {Object} paymentData - Payment data
     * @param {string} paymentData.orderId - Order ID (will be used as both orderId and requestId)
     * @param {number} paymentData.amount - Payment amount
     * @param {string} paymentData.orderInfo - Order information
     * @param {string} paymentData.extraData - Extra data (optional)
     * @param {string} paymentData.internalOrderId - Internal order ID for mapping (optional)
     * @param {Array} paymentData.items - List of items (optional)
     * @param {Object} paymentData.deliveryInfo - Delivery information (optional)
     * @param {Object} paymentData.userInfo - User information (optional)
     * @param {string} paymentData.referenceId - Reference ID (optional)
     * @param {string} paymentData.storeName - Store name (optional)
     * @param {string} paymentData.subPartnerCode - Sub partner code (optional)
     * @returns {Object} Payment URL and request data
     */
    static async createPayment({
        orderId,
        momoOrderId,
        amount,
        orderInfo = 'Thanh toán đơn hàng',
        extraData = '',
        items = [],
        deliveryInfo = null,
        userInfo = null,
        referenceId = null,
        storeName = null,
        subPartnerCode = null,
    }) {
        try {
            // Validate input
            if (!orderId || !amount) {
                throw new BadRequestError('orderId and amount are required');
            }

            // Validate amount range according to MoMo documentation
            if (amount < 1000 || amount > 50000000) {
                throw new BadRequestError(
                    'Amount must be between 1,000 and 50,000,000 VND',
                );
            }

            // Use momoOrderId as requestId as per documentation requirement
            const requestId = momoOrderId;

            // Create raw signature string - EXACT format from MoMo documentation
            const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;

            // Create signature
            const signature = crypto
                .createHmac('sha256', momoConfig.secretKey)
                .update(rawSignature)
                .digest('hex');

            // Create request body - EXACT format from MoMo documentation
            const requestBody = {
                partnerCode: momoConfig.partnerCode,
                accessKey: momoConfig.accessKey, // Add accessKey as per documentation
                requestId: requestId,
                amount: amount.toString(),
                orderId: momoOrderId,
                orderInfo: orderInfo,
                redirectUrl: momoConfig.redirectUrl,
                ipnUrl: momoConfig.ipnUrl,
                extraData: extraData,
                requestType: momoConfig.requestType,
                signature: signature,
                lang: momoConfig.lang,
            };

            // Add optional fields
            if (storeName) requestBody.storeName = storeName;
            if (subPartnerCode) requestBody.subPartnerCode = subPartnerCode;
            if (referenceId) requestBody.referenceId = referenceId;
            if (items && items.length > 0) requestBody.items = items;
            if (deliveryInfo) requestBody.deliveryInfo = deliveryInfo;
            if (userInfo) requestBody.userInfo = userInfo;

            // Send request to MoMo
            const response = await this.sendMoMoRequest(
                requestBody,
                MOMO_ENDPOINTS.CREATE_PAYMENT,
            );

            // Check MoMo response
            if (response.resultCode !== MOMO_RESULT_CODES.SUCCESS) {
                throw new BadRequestError(
                    `MoMo payment creation failed: ${response.message}`,
                );
            }
            // Update cart status to ordered (cart is no longer active)
            const order = await database.Order.findByPk(orderId);

            if (order && order.user_id) {
                await database.Cart.update(
                    { status: CART_STATUS.ORDERED },
                    {
                        where: {
                            user_id: order.user_id,
                            status: CART_STATUS.ACTIVE,
                        },
                    },
                );
            }

            // Note: Order status should be managed separately from payment status
            // Order status tracks: pending, confirmed, processing, shipped, delivered, cancelled
            // Payment status tracks: pending, completed, failed, refunded, expired

            return {
                payUrl: response.payUrl,
                deeplink: response.deeplink,
                qrCodeUrl: response.qrCodeUrl,
                deeplinkMiniApp: response.deeplinkMiniApp,
                orderId: orderId,
                requestId: requestId,
                amount: amount,
                payment: {
                    order_id: orderId,
                    payment_method: 'momo',
                    transaction_id: requestId,
                    transaction_code: response.transId || null,
                    status: MOMO_PAYMENT_STATUS.PENDING,
                    amount: amount,
                    gateway_response: JSON.stringify(response),
                },
                responseTime: response.responseTime,
                userFee: response.userFee || 0,
            };
        } catch (error) {
            console.error('MoMo payment creation error:', error);
            throw error;
        }
    }

    // ===============================
    // MAIN FUNCTION 2: IPN CALLBACK
    // ===============================
    /**
     * Handle MoMo IPN callback to update order status
     * @param {Object} ipnData - IPN data from MoMo
     * @returns {Object} Response for MoMo
     */
    static async handleIpnCallback(ipnData) {
        try {
            // Validate signature
            // const isValidSignature = this.validateIpnSignature(ipnData);
            // if (!isValidSignature) {
            //     throw new BadRequestError('Invalid signature');
            // }

            const {
                orderId,
                requestId,
                resultCode,
                amount,
                transId,
                message,
                payType,
            } = ipnData;

            // Update payment record
            const payment = await database.Payment.findOne({
                where: { transaction_id: requestId },
                include: [
                    {
                        model: database.Order,
                        as: 'order',
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
                    },
                ],
            });

            if (!payment) {
                throw new BadRequestError('Payment record not found');
            }

            // Update payment status based on result code
            let paymentStatus = MOMO_PAYMENT_STATUS.PENDING;

            if (resultCode === MOMO_RESULT_CODES.SUCCESS) {
                paymentStatus = MOMO_PAYMENT_STATUS.COMPLETED;
            } else if (resultCode === MOMO_RESULT_CODES.TRANSACTION_CANCELLED) {
                paymentStatus = MOMO_PAYMENT_STATUS.CANCELLED;
            } else if (resultCode === MOMO_RESULT_CODES.PAYMENT_EXPIRED) {
                paymentStatus = MOMO_PAYMENT_STATUS.EXPIRED;
            } else {
                paymentStatus = MOMO_PAYMENT_STATUS.FAILED;
            }

            // Update payment record only - order status should be managed separately
            await database.Payment.update(
                {
                    status: paymentStatus,
                    transaction_code: transId,
                    gateway_response: JSON.stringify(ipnData),
                    paid_at:
                        resultCode === MOMO_RESULT_CODES.SUCCESS
                            ? new Date()
                            : null,
                },
                {
                    where: { id: payment.id },
                },
            );

            await database.OrderLog.create({
                order_id: payment.order_id,
                from_status: 'pending_confirmation',
                to_status: 'pending_confirmation', // Payment update doesn't change order status
                action: 'payment_completed',
                actor_type: 'payment_gateway',
                actor_id: null,
                actor_name: 'MoMo',
                note: `Payment status updated to ${paymentStatus} via MoMo IPN (resultCode: ${resultCode})`,
                metadata: JSON.stringify({
                    amount,
                    transId,
                    payType,
                    message,
                    ipn: true,
                    payment_status: paymentStatus,
                    result_code: resultCode,
                }),
            });

            // Gửi email thông báo cho người dùng về trạng thái thanh toán
            if (
                payment.order &&
                payment.order.user &&
                payment.order.user.user_email
            ) {
                try {
                    await this.sendPaymentNotificationEmail(
                        payment.order.user.user_email,
                        payment.order.user.user_nickname ||
                            payment.order.user.user_login,
                        payment.order,
                        paymentStatus,
                        {
                            amount,
                            transId,
                            payType,
                            message,
                            resultCode,
                        },
                    );
                } catch (emailError) {
                    console.error(
                        'Failed to send payment notification email:',
                        emailError,
                    );
                    // Không throw error để không ảnh hưởng đến flow IPN
                }
            }

            // Note: Order status should be updated by order management system
            // based on business logic, not directly tied to payment status

            return {
                status: 'success',
                message: 'IPN processed successfully',
                orderId: orderId,
                resultCode: resultCode,
            };
        } catch (error) {
            console.error('MoMo IPN callback error:', error);
            throw error;
        }
    }

    // ===============================
    // MAIN FUNCTION 3: CHECK TRANSACTION STATUS
    // ===============================
    /**
     * Check transaction status and update order
     * @param {string} orderId - Order ID
     * @returns {Object} Transaction status
     */
    static async checkTransactionStatus(orderId) {
        try {
            if (!orderId) {
                throw new BadRequestError('orderId is required');
            }

            // First try to find by order_id, then by external_order_id (momo order id)
            let payment = await database.Payment.findOne({
                where: { order_id: orderId, payment_method: 'momo' },
            });

            if (!payment) {
                // Try to find by external_order_id (momo order id)
                payment = await database.Payment.findOne({
                    where: {
                        external_order_id: orderId,
                        payment_method: 'momo',
                    },
                });
            }

            if (!payment) {
                // Try to find by transaction_id
                payment = await database.Payment.findOne({
                    where: { transaction_id: orderId, payment_method: 'momo' },
                });
            }

            if (!payment) {
                throw new BadRequestError('Payment record not found');
            }

            // Use orderId as requestId
            const requestId = orderId;

            // Create signature for query
            const rawSignature = `accessKey=${momoConfig.accessKey}&orderId=${orderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}`;
            const signature = crypto
                .createHmac('sha256', momoConfig.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: momoConfig.partnerCode,
                requestId: requestId,
                orderId: orderId,
                signature: signature,
                lang: momoConfig.lang,
            };

            // Send request to MoMo
            const response = await this.sendMoMoRequest(
                requestBody,
                MOMO_ENDPOINTS.QUERY_TRANSACTION,
            );

            // Update payment and order status based on response
            if (response.resultCode === MOMO_RESULT_CODES.SUCCESS) {
                if (payment && payment.status === MOMO_PAYMENT_STATUS.PENDING) {
                    // Update payment status only
                    await database.Payment.update(
                        {
                            status: MOMO_PAYMENT_STATUS.COMPLETED,
                            transaction_code: response.transId,
                            gateway_response: JSON.stringify(response),
                            paid_at: new Date(),
                        },
                        {
                            where: { id: payment.id },
                        },
                    );

                    // Create order log only when payment status changes
                    await database.OrderLog.create({
                        order_id: payment.order_id,
                        from_status: 'pending_confirmation',
                        to_status: 'pending_confirmation', // Payment update doesn't change order status
                        action: 'payment_updated',
                        actor_type: 'payment_gateway',
                        actor_id: null,
                        actor_name: 'MoMo',
                        note: `Payment status changed from PENDING to COMPLETED (resultCode: ${response.resultCode})`,
                        metadata: JSON.stringify({
                            amount: response.amount,
                            transId: response.transId,
                            payType: response.payType,
                            message: response.message,
                            old_payment_status: MOMO_PAYMENT_STATUS.PENDING,
                            new_payment_status: MOMO_PAYMENT_STATUS.COMPLETED,
                            result_code: response.resultCode,
                            check_transaction: true,
                            response_time: response.responseTime,
                        }),
                    });

                    // Note: Order status should be updated by order management system
                    // based on business logic, not directly tied to payment status
                } else {
                }
            } else {
                // No log created for failed checks unless status actually changes
            }

            return {
                orderId: orderId,
                transId: response.transId,
                resultCode: response.resultCode,
                message: response.message,
                amount: response.amount,
                payType: response.payType,
                responseTime: response.responseTime,
                extraData: response.extraData,
                paymentOption: response.paymentOption,
                promotionInfo: response.promotionInfo,
                refundTrans: response.refundTrans || [],
            };
        } catch (error) {
            console.error('Check transaction status error:', error);
            throw error;
        }
    }

    // ===============================
    // MAIN FUNCTION 4: REFUND TRANSACTION
    // ===============================
    /**
     * Refund complete transaction
     * @param {string} orderId - Order ID
     * @param {number} transId - MoMo transaction ID
     * @param {number} amount - Refund amount
     * @param {string} description - Refund description
     * @returns {Object} Refund response
     */
    static async refundTransaction(
        orderId,
        transId,
        amount,
        description = 'Hoàn tiền đơn hàng',
    ) {
        try {
            if (!orderId || !transId || !amount) {
                throw new BadRequestError(
                    'orderId, transId, and amount are required',
                );
            }

            // Create refund order ID (different from original order ID)
            const payment = await database.Payment.findOne({
                where: { order_id: orderId, payment_method: 'momo' },
            });

            if (!payment) {
                throw new BadRequestError('Payment record not found');
            }
            if (payment.status !== MOMO_PAYMENT_STATUS.COMPLETED) {
                throw new BadRequestError(
                    'Only completed transactions can be refunded',
                );
            }

            const refundOrderId = `REFUND_${payment.external_order_id}_${Date.now()}`;
            const requestId = refundOrderId;

            // Create signature for refund
            const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&description=${description}&orderId=${refundOrderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}&transId=${transId}`;
            const signature = crypto
                .createHmac('sha256', momoConfig.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: momoConfig.partnerCode,
                orderId: refundOrderId,
                requestId: requestId,
                amount: amount,
                transId: transId,
                lang: momoConfig.lang,
                description: description,
                signature: signature,
            };

            // Send refund request to MoMo
            const response = await this.sendMoMoRequest(
                requestBody,
                MOMO_ENDPOINTS.REFUND_PAYMENT,
            );

            // Check refund response
            if (response.resultCode === MOMO_RESULT_CODES.SUCCESS) {
                // Update payment status to refunded
                await database.Payment.update(
                    {
                        status: MOMO_PAYMENT_STATUS.REFUNDED,
                        gateway_response: JSON.stringify(response),
                    },
                    {
                        where: { order_id: orderId, payment_method: 'momo' },
                    },
                );

                // Note: Order status should be updated by order management system
                // based on business logic (e.g., order might be cancelled, returned, etc.)
                // not directly tied to payment refund

                // Create refund payment record
                await database.Payment.create({
                    order_id: orderId,
                    payment_method: 'momo_refund',
                    external_order_id: refundOrderId,
                    transaction_id: requestId,
                    transaction_code: response.transId,
                    status: MOMO_PAYMENT_STATUS.COMPLETED,
                    amount: -amount, // Negative amount for refund
                    gateway_response: JSON.stringify(response),
                    paid_at: new Date(),
                });
            }

            return {
                orderId: refundOrderId,
                originalOrderId: orderId,
                transId: response.transId,
                resultCode: response.resultCode,
                message: response.message,
                amount: amount,
                responseTime: response.responseTime,
            };
        } catch (error) {
            console.error('MoMo refund error:', error);
            throw error;
        }
    }

    // ===============================
    // HELPER METHODS
    // ===============================
    /**
     * Send request to MoMo API
     * @param {Object} requestBody - Request body
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} MoMo response
     */
    static async sendMoMoRequest(requestBody, endpoint) {
        return new Promise((resolve, reject) => {
            const requestBodyString = JSON.stringify(requestBody);

            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBodyString),
                },
                timeout: 30000, // 30 seconds timeout as per documentation
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid JSON response from MoMo'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`MoMo request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('MoMo request timeout'));
            });

            req.write(requestBodyString);
            req.end();
        });
    }

    /**
     * Validate IPN signature
     * @param {Object} ipnData - IPN data
     * @returns {boolean} Is valid signature
     */
    static validateIpnSignature(ipnData) {
        const {
            amount,
            extraData,
            message,
            orderId,
            orderInfo,
            orderType,
            partnerCode,
            payType,
            requestId,
            responseTime,
            resultCode,
            transId,
            signature,
        } = ipnData;

        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const expectedSignature = crypto
            .createHmac('sha256', momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Get payment status by order ID
     * @param {string} orderId - Order ID
     * @returns {Object} Payment status
     */
    static async getPaymentStatus(orderId) {
        try {
            const payment = await database.Payment.findOne({
                where: { order_id: orderId, payment_method: 'momo' },
            });

            if (!payment) {
                throw new BadRequestError('Payment not found');
            }

            return {
                orderId: orderId,
                paymentStatus: payment.status,
                amount: payment.amount,
                transactionId: payment.transaction_id,
                transactionCode: payment.transaction_code,
                paidAt: payment.paid_at,
                gatewayResponse: payment.gateway_response,
            };
        } catch (error) {
            console.error('Get payment status error:', error);
            throw error;
        }
    }

    /**
     * Send payment notification email to user
     * @param {string} email - User email
     * @param {string} username - User name
     * @param {Object} order - Order object
     * @param {string} paymentStatus - Payment status
     * @param {Object} paymentInfo - Payment information
     */
    static async sendPaymentNotificationEmail(
        email,
        username,
        order,
        paymentStatus,
        paymentInfo,
    ) {
        try {
            const { amount, transId, payType, message, resultCode } =
                paymentInfo;

            let subject = '';
            let emailContent = '';

            switch (paymentStatus) {
                case MOMO_PAYMENT_STATUS.COMPLETED:
                    subject = `Thanh toán thành công - Đơn hàng #${order.id}`;
                    emailContent = `
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #4caf50; text-align: center;">Thanh toán thành công!</h2>
                            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p>Xin chào <strong>${username}</strong>,</p>
                                <p>Thanh toán cho đơn hàng #${order.id} đã được xử lý thành công qua MoMo.</p>
                                
                                <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
                                    <h3 style="color: #388e3c; margin-top: 0;">Chi tiết thanh toán</h3>
                                    <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                                    <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
                                    <p><strong>Mã giao dịch:</strong> ${transId}</p>
                                    <p><strong>Phương thức:</strong> ${payType}</p>
                                    <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                                </div>

                                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                    <h4 style="color: #856404; margin-top: 0;">Bước tiếp theo</h4>
                                    <p>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi đơn hàng được xác nhận và bắt đầu giao hàng.</p>
                                </div>

                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}" 
                                       style="background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                        Xem chi tiết đơn hàng
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;

                case MOMO_PAYMENT_STATUS.CANCELLED:
                    subject = `Thanh toán đã bị hủy - Đơn hàng #${order.id}`;
                    emailContent = `
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #f44336; text-align: center;">Thanh toán đã bị hủy</h2>
                            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p>Xin chào <strong>${username}</strong>,</p>
                                <p>Thanh toán cho đơn hàng #${order.id} đã bị hủy.</p>
                                
                                <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                                    <h3 style="color: #d32f2f; margin-top: 0;">Chi tiết</h3>
                                    <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                                    <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
                                    <p><strong>Lý do:</strong> ${message}</p>
                                    <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                                </div>

                                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
                                    <h4 style="color: #1976d2; margin-top: 0;">Bạn có thể</h4>
                                    <p>• Thử thanh toán lại bằng cách truy cập đơn hàng</p>
                                    <p>• Chọn phương thức thanh toán khác (COD)</p>
                                    <p>• Hủy đơn hàng nếu không muốn tiếp tục</p>
                                </div>

                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}" 
                                       style="background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                        Xem đơn hàng
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;

                case MOMO_PAYMENT_STATUS.FAILED:
                    subject = `Thanh toán thất bại - Đơn hàng #${order.id}`;
                    emailContent = `
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #f44336; text-align: center;">Thanh toán thất bại</h2>
                            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p>Xin chào <strong>${username}</strong>,</p>
                                <p>Thanh toán cho đơn hàng #${order.id} đã thất bại.</p>
                                
                                <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                                    <h3 style="color: #d32f2f; margin-top: 0;">Chi tiết lỗi</h3>
                                    <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                                    <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
                                    <p><strong>Lý do:</strong> ${message}</p>
                                    <p><strong>Mã lỗi:</strong> ${resultCode}</p>
                                    <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                                </div>

                                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
                                    <h4 style="color: #1976d2; margin-top: 0;">Khuyến nghị</h4>
                                    <p>• Kiểm tra lại thông tin thẻ/tài khoản</p>
                                    <p>• Đảm bảo tài khoản có đủ số dư</p>
                                    <p>• Thử thanh toán lại sau vài phút</p>
                                    <p>• Liên hệ với chúng tôi nếu vấn đề vẫn tiếp tục</p>
                                </div>

                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}" 
                                       style="background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                        Thử thanh toán lại
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;

                case MOMO_PAYMENT_STATUS.EXPIRED:
                    subject = `Thanh toán đã hết hạn - Đơn hàng #${order.id}`;
                    emailContent = `
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #ff9800; text-align: center;">Thanh toán đã hết hạn</h2>
                            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p>Xin chào <strong>${username}</strong>,</p>
                                <p>Thanh toán cho đơn hàng #${order.id} đã hết hạn.</p>
                                
                                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                    <h3 style="color: #856404; margin-top: 0;">Chi tiết</h3>
                                    <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                                    <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
                                    <p><strong>Thời gian hết hạn:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                                </div>

                                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
                                    <h4 style="color: #1976d2; margin-top: 0;">Bạn có thể</h4>
                                    <p>• Tạo link thanh toán mới</p>
                                    <p>• Chọn phương thức thanh toán khác (COD)</p>
                                    <p>• Hủy đơn hàng nếu không muốn tiếp tục</p>
                                </div>

                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}" 
                                       style="background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                        Thanh toán lại
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;

                default:
                    // Không gửi email cho trạng thái khác
                    return;
            }

            // Gửi email
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
                to: email,
                subject: subject,
                html: emailContent,
            };

            await EmailService.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Send payment notification email error:', error);
            throw error;
        }
    }
}

module.exports = MomoPaymentService;
