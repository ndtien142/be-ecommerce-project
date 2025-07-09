'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class ShippingMethodService {
    static async createShippingMethod({
        name,
        code,
        description,
        status = 'active',
    }) {
        if (!name || !code)
            throw new BadRequestError('name và code là bắt buộc');
        const shippingMethod = await database.ShippingMethod.create({
            name,
            code,
            description,
            status,
        });
        return toCamel(shippingMethod.toJSON());
    }

    static async getAllShippingMethods({ status } = {}) {
        const where = {};
        if (status) where.status = status;
        const methods = await database.ShippingMethod.findAll({ where });
        return methods.map((sm) => toCamel(sm.toJSON()));
    }

    static async getShippingMethodById(id) {
        const method = await database.ShippingMethod.findByPk(id);
        if (!method)
            throw new NotFoundError('Không tìm thấy phương thức vận chuyển');
        return toCamel(method.toJSON());
    }

    static async updateShippingMethod(id, updateData) {
        const [affectedRows] = await database.ShippingMethod.update(
            updateData,
            { where: { id } },
        );
        if (!affectedRows)
            throw new NotFoundError(
                'Không tìm thấy phương thức vận chuyển hoặc không được cập nhật',
            );
        return await ShippingMethodService.getShippingMethodById(id);
    }

    static async changeStatus(id, status) {
        if (!['active', 'inactive'].includes(status)) {
            throw new BadRequestError('Trạng thái không hợp lệ');
        }
        const [affectedRows] = await database.ShippingMethod.update(
            { status },
            { where: { id } },
        );
        if (!affectedRows)
            throw new NotFoundError(
                'Không tìm thấy phương thức vận chuyển hoặc không được cập nhật',
            );
        return await ShippingMethodService.getShippingMethodById(id);
    }
}

module.exports = ShippingMethodService;
