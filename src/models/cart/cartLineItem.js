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
        cart_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sku_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
    };

    const options = {
        tableName: 'tb_cart_line_item',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const CartLineItem = sequelize.define('CartLineItem', attributes, options);

    return CartLineItem;
};
