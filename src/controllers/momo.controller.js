'use strict';

const MomoPaymentService = require('../services/payment/momo.service');
const { SuccessResponse, CREATED, OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class MomoPaymentController {
    /**
     * Create MoMo payment - MAIN FUNCTION 1
     */
    createPayment = async (req, res, next) => {
        const {
            orderId,
            amount,
            orderInfo,
            extraData,
            items,
            deliveryInfo,
            userInfo,
            referenceId,
            storeName,
            subPartnerCode,
        } = req.body;

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
                items,
                deliveryInfo,
                userInfo,
                referenceId,
                storeName,
                subPartnerCode,
            }),
        }).send(res);
    };

    /**
     * Handle MoMo IPN callback - MAIN FUNCTION 2
     */
    handleIpn = async (req, res, next) => {
        const ipnData = req.body;

        const result = await MomoPaymentService.handleIpnCallback(ipnData);

        new OK({
            message: 'IPN processed successfully',
            metadata: result,
        }).send(res);
    };

    /**
     * Check transaction status - MAIN FUNCTION 3
     */
    checkTransactionStatus = async (req, res, next) => {
        const { orderId } = req.params;

        if (!orderId) {
            throw new BadRequestError('orderId is required');
        }

        new OK({
            message: 'Kiểm tra trạng thái giao dịch thành công',
            metadata: await MomoPaymentService.checkTransactionStatus(orderId),
        }).send(res);
    };

    /**
     * Refund transaction - MAIN FUNCTION 4
     */
    refundTransaction = async (req, res, next) => {
        const { orderId, transId, amount, description } = req.body;

        if (!orderId || !transId || !amount) {
            throw new BadRequestError(
                'orderId, transId, and amount are required',
            );
        }

        new OK({
            message: 'Hoàn tiền giao dịch thành công',
            metadata: await MomoPaymentService.refundTransaction(
                orderId,
                transId,
                amount,
                description,
            ),
        }).send(res);
    };

    /**
     * Get payment status
     */
    getPaymentStatus = async (req, res, next) => {
        const { orderId } = req.params;

        if (!orderId) {
            throw new BadRequestError('orderId is required');
        }

        new OK({
            message: 'Lấy trạng thái thanh toán thành công',
            metadata: await MomoPaymentService.getPaymentStatus(orderId),
        }).send(res);
    };

    /**
     * Handle MoMo return URL (when user returns from MoMo app/web)
     */
    handleReturn = async (req, res, next) => {
        try {
            const { orderId, requestId, resultCode, message } = req.query;

            // You can redirect to your frontend with the result
            const redirectUrl = `${process.env.FRONTEND_URL}/payment/result?orderId=${orderId}&resultCode=${resultCode}&message=${encodeURIComponent(message)}`;

            res.redirect(redirectUrl);
        } catch (error) {
            console.error('MoMo return handler error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
        }
    };
}

module.exports = new MomoPaymentController();
