'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ShippingMethod = sequelize.define(
        'ShippingMethod',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: { type: DataTypes.STRING(100), allowNull: false }, // Tên hiển thị
            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            }, // Mã: ghn, ghtk, cod, viettel...
            description: { type: DataTypes.TEXT, allowNull: true },
            status: {
                type: DataTypes.ENUM('active', 'inactive'),
                allowNull: false,
                defaultValue: 'active',
            },
        },
        {
            tableName: 'tb_shipping_method',
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        },
    );

    return ShippingMethod;
};
