'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define(
        'Payment',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            order_id: { type: DataTypes.INTEGER, allowNull: false },
            payment_method_id: { type: DataTypes.INTEGER, allowNull: false },
            customer_payment_option_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            transaction_code: { type: DataTypes.STRING }, // mã giao dịch Momo/ví
            status: {
                type: DataTypes.ENUM('pending', 'success', 'failed'),
                allowNull: false,
                defaultValue: 'pending',
            },
            amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
            paid_at: { type: DataTypes.DATE, allowNull: true },
        },
        {
            tableName: 'tb_payment',
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        },
    );

    return Payment;
};
