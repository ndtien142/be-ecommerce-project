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
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        address_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        payment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'paid',
                'shipped',
                'completed',
                'cancelled',
            ),
            allowNull: false,
            defaultValue: 'pending',
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ordered_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        shipped_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        delivered_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_order',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Order = sequelize.define('Order', attributes, options);

    return Order;
};
