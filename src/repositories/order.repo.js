'use strict';

const database = require('../../models');

class OrderRepo {
    // Order
    static async findOrderById(id, options = {}) {
        return database.Order.findByPk(id, options);
    }

    static async findOrder(where, options = {}) {
        return database.Order.findOne({ where, ...options });
    }

    static async createOrder(orderData, transaction) {
        return database.Order.create(orderData, { transaction });
    }

    static async updateOrder(orderInstance, transaction) {
        return orderInstance.save({ transaction });
    }

    static async findOrders(
        where,
        { limit, offset, order = [['create_time', 'DESC']] } = {},
        include = [],
    ) {
        return database.Order.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include,
        });
    }

    static async countOrders(where) {
        return database.Order.count({ where });
    }

    // OrderLineItem
    static async createOrderLineItem(lineItemData, transaction) {
        return database.OrderLineItem.create(lineItemData, { transaction });
    }

    static async findOrderLineItems(where, options = {}) {
        return database.OrderLineItem.findAll({ where, ...options });
    }

    static async updateOrderLineItem(lineItemInstance, transaction) {
        return lineItemInstance.save({ transaction });
    }

    // Product
    static async findProductById(id, options = {}) {
        return database.Product.findByPk(id, options);
    }

    static async updateProduct(productInstance, transaction) {
        return productInstance.save({ transaction });
    }

    // Payment
    static async createPayment(paymentData, transaction) {
        return database.Payment.create(paymentData, { transaction });
    }

    static async findPayment(where, options = {}) {
        return database.Payment.findOne({ where, ...options });
    }

    // Cart
    static async findCartById(id, options = {}) {
        return database.Cart.findByPk(id, options);
    }

    static async updateCart(cartInstance, transaction) {
        return cartInstance.save({ transaction });
    }

    // UserCoupon
    static async findUserCoupon(where, options = {}) {
        return database.UserCoupon.findOne({ where, ...options });
    }

    // Transaction
    static async getSequelizeTransaction() {
        return database.sequelize.transaction();
    }
}

module.exports = OrderRepo;
