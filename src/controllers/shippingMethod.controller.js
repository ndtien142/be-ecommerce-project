'use strict';

const ShippingMethodService = require('../services/shipping/shippingMethod.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class ShippingMethodController {
    createShippingMethod = async (req, res, next) => {
        new CREATED({
            message: 'Tạo phương thức vận chuyển thành công',
            metadata: await ShippingMethodService.createShippingMethod(
                req.body,
            ),
        }).send(res);
    };

    getAllShippingMethods = async (req, res, next) => {
        new SuccessResponse({
            metadata: await ShippingMethodService.getAllShippingMethods(
                req.query,
            ),
        }).send(res);
    };

    getShippingMethodById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await ShippingMethodService.getShippingMethodById(
                req.params.id,
            ),
        }).send(res);
    };

    updateShippingMethod = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật phương thức vận chuyển thành công',
            metadata: await ShippingMethodService.updateShippingMethod(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    changeStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật trạng thái phương thức vận chuyển thành công',
            metadata: await ShippingMethodService.changeStatus(
                req.params.id,
                req.body.status,
            ),
        }).send(res);
    };
}

module.exports = new ShippingMethodController();
