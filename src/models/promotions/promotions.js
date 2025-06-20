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
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM('percent', 'fixed', 'free_shipping'),
            allowNull: false,
        },
        value: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        min_order_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        max_discount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        usage_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        used_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'expired'),
            allowNull: false,
            defaultValue: 'active',
        },
    };

    const options = {
        tableName: 'tb_promotions',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Promotion = sequelize.define('Promotion', attributes, options);

    return Promotion;
};
