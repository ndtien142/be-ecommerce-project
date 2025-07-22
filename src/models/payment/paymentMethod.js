'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: 'payment_method_name_unique',
        },
        provider: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
    };

    const options = {
        tableName: 'tb_payment_method',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const PaymentMethod = sequelize.define(
        'PaymentMethod',
        attributes,
        options,
    );

    return PaymentMethod;
};
