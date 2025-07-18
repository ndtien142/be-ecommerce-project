'use strict';

const AddressService = require('../services/billing-address/address.service');
const { SuccessResponse, CREATED } = require('../core/success.response');

class AddressController {
    createAddress = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new CREATED({
            message: 'Tạo địa chỉ thành công',
            metadata: await AddressService.createAddress({
                ...req.body,
                userId,
            }),
        }).send(res);
    };

    getAddressesByUser = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        new SuccessResponse({
            metadata: await AddressService.getAddressesByUser(userId),
        }).send(res);
    };

    getAddressById = async (req, res, next) => {
        new SuccessResponse({
            metadata: await AddressService.getAddressById(req.params.id),
        }).send(res);
    };

    updateAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Cập nhật địa chỉ thành công',
            metadata: await AddressService.updateAddress(
                req.params.id,
                req.body,
            ),
        }).send(res);
    };

    deleteAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Xóa địa chỉ thành công',
            metadata: await AddressService.deleteAddress(req.params.id),
        }).send(res);
    };

    setDefaultAddress = async (req, res, next) => {
        const userId = req.user?.userId || req.headers['x-user-id'];
        const addressId = req.body.addressId;
        new SuccessResponse({
            message: 'Đặt địa chỉ mặc định thành công',
            metadata: await AddressService.setDefaultAddress(userId, addressId),
        }).send(res);
    };
}

module.exports = new AddressController();
