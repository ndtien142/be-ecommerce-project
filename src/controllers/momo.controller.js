'use strict';

const MomoPaymentService = require('../services/payment/momo.service');
const { SuccessResponse, CREATED } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class MomoPaymentController {
    /**
     * Create MoMo payment
     */
    createPayment = async (req, res, next) => {
        const { orderId, amount, orderInfo, extraData } = req.body;

        if (!orderId || !amount) {
            throw new BadRequestError('orderId and amount are required');
        }

        new CREATED({
            message: 'Tạo thanh toán MoMo thành công',
            metadata: await MomoPaymentService.createPayment({
                orderId,
                amount,
                orderInfo,
                extraData,
            }),
        }).send(res);
    };

    /**
     * Handle MoMo return URL (when user returns from MoMo app/web)
     */
    handleReturn = async (req, res, next) => {
        try {
            const { orderId: momoOrderId, resultCode, message } = req.query;

            // Extract internal order ID from MoMo order ID
            let internalOrderId = momoOrderId;
            if (momoOrderId && momoOrderId.startsWith('ORDER_')) {
                const parts = momoOrderId.split('_');
                if (parts.length >= 2) {
                    internalOrderId = parts[1]; // Extract order ID from ORDER_{id}_{timestamp}_{random}
                }
            }

            if (resultCode === '0') {
                // Payment successful - redirect to success page
                res.redirect(
                    `${process.env.FRONTEND_URL}/payment/success?orderId=${internalOrderId}`,
                );
            } else {
                // Payment failed - redirect to failure page
                res.redirect(
                    `${process.env.FRONTEND_URL}/payment/failed?orderId=${internalOrderId}&message=${encodeURIComponent(message)}`,
                );
            }
        } catch (error) {
            console.error('MoMo return handling error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
        }
    };

    /**
     * Handle MoMo IPN (Instant Payment Notification)
     */
    handleIPN = async (req, res, next) => {
        try {
            const result = await MomoPaymentService.handleIPN(req.body);
            res.status(200).json(result);
        } catch (error) {
            console.error('MoMo IPN handling error:', error);
            res.status(500).json({
                resultCode: 1,
                message: 'Error processing IPN',
            });
        }
    };

    /**
     * Get payment status
     */
    getPaymentStatus = async (req, res, next) => {
        const { orderId } = req.params;

        new SuccessResponse({
            message: 'Lấy trạng thái thanh toán thành công',
            metadata: await MomoPaymentService.getPaymentStatus(orderId),
        }).send(res);
    };

    /**
     * Verify signature (for testing purposes)
     */
    verifySignature = async (req, res, next) => {
        const isValid = MomoPaymentService.verifySignature(req.body);

        new SuccessResponse({
            message: 'Xác thực chữ ký',
            metadata: { isValid },
        }).send(res);
    };
}

module.exports = new MomoPaymentController();
