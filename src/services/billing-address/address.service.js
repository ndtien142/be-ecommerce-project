'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class AddressService {
    static async createAddress({
        userId,
        isDefault,
        title,
        country,
        city,
        district,
        ward,
        street,
        streetNumber,
        receiverName,
        phoneNumber,
        ...rest
    }) {
        if (!userId) throw new BadRequestError('userId là bắt buộc');
        // If isDefault is true, set all user's addresses to is_default: false
        if (isDefault === true) {
            await database.UserAddress.update(
                { is_default: false },
                { where: { user_id: userId } },
            );
        }
        const address = await database.UserAddress.create({
            user_id: userId,
            is_default: !!isDefault,
            title,
            country,
            city,
            district,
            ward,
            street,
            street_number: streetNumber,
            receiver_name: receiverName,
            phone_number: phoneNumber,
            ...rest,
        });
        return toCamel(address.toJSON());
    }

    static async getAddressesByUser(userId) {
        if (!userId) throw new BadRequestError('userId is required');
        const addresses = await database.UserAddress.findAll({
            where: { user_id: userId, status: 'active' },
        });
        return addresses.map((addr) => toCamel(addr.toJSON()));
    }

    static async getAddressById(id) {
        const address = await database.UserAddress.findByPk(id);
        if (!address) throw new NotFoundError('Address not found');
        return toCamel(address.toJSON());
    }

    static async updateAddress(id, updateData) {
        const [affectedRows] = await database.UserAddress.update(updateData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Address not found or not updated');
        return await AddressService.getAddressById(id);
    }

    static async deleteAddress(id) {
        const deleted = await database.UserAddress.destroy({ where: { id } });
        if (!deleted)
            throw new NotFoundError('Không tìm thấy địa chỉ hoặc đã bị xóa');
        return { message: 'Xóa địa chỉ thành công' };
    }

    static async setDefaultAddress(userId, addressId) {
        if (!userId || !addressId)
            throw new BadRequestError('userId và addressId là bắt buộc');
        // Remove default from all user's addresses
        await database.UserAddress.update(
            { is_default: false },
            { where: { user_id: userId } },
        );
        // Set default for the selected address
        const [affectedRows] = await database.UserAddress.update(
            { is_default: true },
            { where: { id: addressId, user_id: userId } },
        );
        if (!affectedRows)
            throw new NotFoundError(
                'Không tìm thấy địa chỉ hoặc không được cập nhật',
            );
        return await AddressService.getAddressById(addressId);
    }
}

module.exports = AddressService;
