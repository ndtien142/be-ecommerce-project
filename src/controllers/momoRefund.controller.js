'use strict';

const { SuccessResponse, CREATED } = require('../core/success.response');
const MomoPaymentService = require('../services/payment/momo.service');
const { asyncHandler } = require('../helpers/asyncHandler');

class MomoRefundController {
    /**
     * Create full refund for an order
     * POST /api/v1/momo/refund/full
     */
    createFullRefund = asyncHandler(async (req, res, next) => {
        const { orderId, reason } = req.body;

        const result = await MomoPaymentService.processFullRefund(
            orderId,
            reason,
        );

        new SuccessResponse({
            message: 'Full refund processed successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Create partial refund for an order
     * POST /api/v1/momo/refund/partial
     */
    createPartialRefund = asyncHandler(async (req, res, next) => {
        const { orderId, amount, reason, items } = req.body;

        const result = await MomoPaymentService.processPartialRefund(
            orderId,
            amount,
            reason,
            items,
        );

        new SuccessResponse({
            message: 'Partial refund processed successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Query refund status
     * GET /api/v1/momo/refund/status/:refundOrderId/:requestId
     */
    queryRefundStatus = asyncHandler(async (req, res, next) => {
        const { refundOrderId, requestId } = req.params;

        const result = await MomoPaymentService.queryRefundStatus(
            refundOrderId,
            requestId,
        );

        new SuccessResponse({
            message: 'Refund status retrieved successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Get refund history for an order
     * GET /api/v1/momo/refund/history/:orderId
     */
    getRefundHistory = asyncHandler(async (req, res, next) => {
        const { orderId } = req.params;

        const history = await MomoPaymentService.getRefundHistory(orderId);

        new SuccessResponse({
            message: 'Refund history retrieved successfully',
            metadata: {
                orderId,
                refunds: history,
                totalRefunds: history.length,
                totalRefundedAmount: history
                    .filter((r) => r.status === 'completed')
                    .reduce((sum, r) => sum + r.amount, 0),
            },
        }).send(res);
    });

    /**
     * Get total refunded amount for an order
     * GET /api/v1/momo/refund/total/:orderId
     */
    getTotalRefunded = asyncHandler(async (req, res, next) => {
        const { orderId } = req.params;

        const totalRefunded =
            await MomoPaymentService.getTotalRefundedAmount(orderId);

        new SuccessResponse({
            message: 'Total refunded amount retrieved successfully',
            metadata: {
                orderId,
                totalRefunded,
            },
        }).send(res);
    });

    /**
     * Create manual refund with custom parameters
     * POST /api/v1/momo/refund/manual
     */
    createManualRefund = asyncHandler(async (req, res, next) => {
        const {
            originalOrderId,
            refundOrderId,
            amount,
            transId,
            description,
            transGroup,
        } = req.body;

        const result = await MomoPaymentService.createRefund({
            originalOrderId,
            refundOrderId,
            amount,
            transId,
            description,
            transGroup,
        });

        new SuccessResponse({
            message: 'Manual refund created successfully',
            metadata: result,
        }).send(res);
    });
}

module.exports = new MomoRefundController();
