'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CustomerPaymentOption = sequelize.define(
        'CustomerPaymentOption',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            payment_method_id: { type: DataTypes.INTEGER, allowNull: false },
            provider_name: { type: DataTypes.STRING }, // 'VISA', 'Momo'
            external_token: { type: DataTypes.STRING }, // token hoặc mã định danh
            last4: { type: DataTypes.STRING(4) }, // 4 số cuối của thẻ
            expired_date: { type: DataTypes.DATE },
            is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
        },
        {
            tableName: 'tb_customer_payment_option',
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        },
    );

    return CustomerPaymentOption;
};
