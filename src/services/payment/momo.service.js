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
            });

            // Update order status based on result
            if (resultCode === 0) {
                // Payment successful
                await this.updateOrderStatus(internalOrderId, 'completed');
            } else {
                // Payment failed
                await this.updateOrderStatus(internalOrderId, 'failed');
            }

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
     */
    static async updateOrderStatus(orderId, paymentStatus) {
        try {
            if (paymentStatus === 'completed') {
                // Complete the order payment process
                const OrderService = require('../order/order.service');
                await OrderService.completeOrderPayment(orderId);
            } else {
                // Payment failed - just update order status
                await database.Order.update(
                    {
                        status: 'payment_failed',
                        updated_at: new Date(),
                    },
                    {
                        where: { id: orderId },
                    },
                );
            }
        } catch (error) {
            console.error('Error updating order status:', error);
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
}

module.exports = MomoPaymentService;
