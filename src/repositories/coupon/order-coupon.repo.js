const db = require('../../models');

class OrderCouponRepo {
    static async count(options = {}) {
        return db.OrderCoupon.count(options);
    }
    static async create(data, transaction) {
        return db.OrderCoupon.create(
            data,
            transaction ? { transaction } : undefined,
        );
    }
}

module.exports = OrderCouponRepo;
