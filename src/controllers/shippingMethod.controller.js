'use strict';

const ShippingMethodService = require('../services/shipping/shippingMethod.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class ShippingMethodController {
    createShippingMethod = async (req, res, next) => {
        new CREATED({
            message: 'Shipping method created successfully',
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
            message: 'Shipping method updated successfully',
            metadata: await ShippingMethodService.updateShippingMethod(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    changeStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Shipping method status updated successfully',
            metadata: await ShippingMethodService.changeStatus(
                req.params.id,
                req.body.status,
            ),
        }).send(res);
    };
}

module.exports = new ShippingMethodController();
