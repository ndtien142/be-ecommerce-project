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
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'ordered'),
            allowNull: false,
            defaultValue: 'active',
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
    };

    const options = {
        tableName: 'tb_cart',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Cart = sequelize.define('Cart', attributes, options);

    return Cart;
};
