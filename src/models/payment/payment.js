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
            payment_method: {
                type: DataTypes.ENUM(
                    'cash',
                    'momo',
                    'vnpay',
                    'bank_transfer',
                    'momo_refund',
                ),
                allowNull: false,
                defaultValue: 'cash',
            },
            customer_payment_option_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            transaction_id: { type: DataTypes.STRING }, // MoMo transaction ID or request ID
            transaction_code: { type: DataTypes.STRING }, // mã giao dịch Momo/ví
            status: {
                type: DataTypes.ENUM(
                    'pending',
                    'completed',
                    'failed',
                    'cancelled',
                    'expired',
                    'refunded',
                    'partially_refunded',
                ),
                allowNull: false,
                defaultValue: 'pending',
            },
            amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
            gateway_response: { type: DataTypes.TEXT }, // Store full response from payment gateway
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
