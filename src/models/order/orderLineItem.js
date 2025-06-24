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
        order_id: {
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
        tableName: 'tb_order_line_item',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const OrderLineItem = sequelize.define(
        'OrderLineItem',
        attributes,
        options,
    );

    return OrderLineItem;
};
