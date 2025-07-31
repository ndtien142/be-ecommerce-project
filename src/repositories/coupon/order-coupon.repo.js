const db = require('../../models');

class OrderCouponRepo {
    static async count(where, include = []) {
        return db.OrderCoupon.count({ where, include });
    }
    static async create(data, transaction) {
        return db.OrderCoupon.create(
            data,
            transaction ? { transaction } : undefined,
        );
    }
}

module.exports = OrderCouponRepo;
