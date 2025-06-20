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
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sku_code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        sku_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        min_stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'archived'),
            allowNull: false,
            defaultValue: 'active',
        },
    };

    const options = {
        tableName: 'tb_sku',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const SKU = sequelize.define('SKU', attributes, options);

    return SKU;
};
