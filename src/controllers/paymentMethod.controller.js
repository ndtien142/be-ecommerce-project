'use strict';

const PaymentMethodService = require('../services/payment/paymentMethod.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class PaymentMethodController {
    createPaymentMethod = async (req, res, next) => {
        new CREATED({
            message: 'Payment method created successfully',
            metadata: await PaymentMethodService.createPaymentMethod(req.body),
        }).send(res);
    };

    getAllPaymentMethods = async (req, res, next) => {
        new SuccessResponse({
            metadata: await PaymentMethodService.getAllPaymentMethods(
                req.query,
            ),
        }).send(res);
    };

    getPaymentMethodById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await PaymentMethodService.getPaymentMethodById(
                req.params.id,
            ),
        }).send(res);
    };

    updatePaymentMethod = async (req, res, next) => {
        new SuccessResponse({
            message: 'Payment method updated successfully',
            metadata: await PaymentMethodService.updatePaymentMethod(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    changeStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Payment method status updated successfully',
            metadata: await PaymentMethodService.changeStatus(
                req.params.id,
                req.body.status,
            ),
        }).send(res);
    };
}

module.exports = new PaymentMethodController();
