'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class ShippingMethodService {
    static async createShippingMethod({ name, code, description, status = 'active' }) {
        if (!name || !code) throw new BadRequestError('name and code are required');
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
        return methods.map(sm => toCamel(sm.toJSON()));
    }

    static async getShippingMethodById(id) {
        const method = await database.ShippingMethod.findByPk(id);
        if (!method) throw new NotFoundError('Shipping method not found');
        return toCamel(method.toJSON());
    }

    static async updateShippingMethod(id, updateData) {
        const [affectedRows] = await database.ShippingMethod.update(updateData, { where: { id } });
        if (!affectedRows) throw new NotFoundError('Shipping method not found or not updated');
        return await ShippingMethodService.getShippingMethodById(id);
    }

    static async changeStatus(id, status) {
        if (!['active', 'inactive'].includes(status)) {
            throw new BadRequestError('Invalid status');
        }
        const [affectedRows] = await database.ShippingMethod.update(
            { status },
            { where: { id } }
        );
        if (!affectedRows) throw new NotFoundError('Shipping method not found or not updated');
        return await ShippingMethodService.getShippingMethodById(id);
    }
}

module.exports = ShippingMethodService;
