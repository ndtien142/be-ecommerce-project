'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');

class PaymentMethodService {
    static async createPaymentMethod({
        name,
        provider,
        description,
        status = 'active',
    }) {
        if (!name || !provider)
            throw new BadRequestError('name and provider are required');
        const paymentMethod = await database.PaymentMethod.create({
            name,
            provider,
            description,
            status,
        });
        return toCamel(paymentMethod.toJSON());
    }

    static async getAllPaymentMethods({ status } = {}) {
        const where = {};
        if (status) where.status = status;
        const methods = await database.PaymentMethod.findAll({ where });
        return methods.map((pm) => toCamel(pm.toJSON()));
    }

    static async getPaymentMethodById(id) {
        const method = await database.PaymentMethod.findByPk(id);
        if (!method) throw new NotFoundError('Payment method not found');
        return toCamel(method.toJSON());
    }

    static async updatePaymentMethod(id, updateData) {
        const [affectedRows] = await database.PaymentMethod.update(updateData, {
            where: { id },
        });
        if (!affectedRows)
            throw new NotFoundError('Payment method not found or not updated');
        return await PaymentMethodService.getPaymentMethodById(id);
    }

    static async changeStatus(id, status) {
        if (!['active', 'inactive'].includes(status)) {
            throw new BadRequestError('Invalid status');
        }
        const [affectedRows] = await database.PaymentMethod.update(
            { status },
            { where: { id } },
        );
        if (!affectedRows)
            throw new NotFoundError('Payment method not found or not updated');
        return await PaymentMethodService.getPaymentMethodById(id);
    }
}

module.exports = PaymentMethodService;
