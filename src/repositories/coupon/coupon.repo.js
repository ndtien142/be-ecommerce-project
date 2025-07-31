const db = require('../../models');
const { Op } = require('sequelize');

class CouponRepo {
    static async findByCode(code) {
        return db.Coupon.findOne({ where: { code } });
    }

    static async findById(id) {
        return db.Coupon.findByPk(id);
    }

    static async findAndCountAll(where = {}, limit, offset, order) {
        return db.Coupon.findAndCountAll({
            where,
            limit: parseInt(limit) || 20,
            offset: parseInt(offset) || 0,
            order,
        });
    }

    static async createCoupon(data) {
        return db.Coupon.create(data);
    }

    static async updateCoupon(id, updateData) {
        return db.Coupon.update(updateData, { where: { id } });
    }

    static async deleteCoupon(id) {
        return db.Coupon.destroy({ where: { id } });
    }

    static async findActiveByCode(code) {
        return db.Coupon.findOne({
            where: {
                code: code.toUpperCase(),
                is_active: true,
            },
        });
    }
    static async incrementUsedCount(id, transaction) {
        return db.Coupon.increment('used_count', {
            where: { id },
            ...(transaction ? { transaction } : {}),
        });
    }
    static async findAllActiveCoupons() {
        return db.Coupon.findAll({ where: { is_active: true } });
    }
}

module.exports = CouponRepo;
