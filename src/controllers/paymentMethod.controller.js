'use strict';

const PaymentMethodService = require('../services/payment/paymentMethod.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class PaymentMethodController {
    createPaymentMethod = async (req, res, next) => {
        new CREATED({
            message: 'Tạo phương thức thanh toán thành công',
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
            message: 'Cập nhật phương thức thanh toán thành công',
            metadata: await PaymentMethodService.updatePaymentMethod(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    changeStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật trạng thái phương thức thanh toán thành công',
            metadata: await PaymentMethodService.changeStatus(
                req.params.id,
                req.body.status,
            ),
        }).send(res);
    };
}

module.exports = new PaymentMethodController();
