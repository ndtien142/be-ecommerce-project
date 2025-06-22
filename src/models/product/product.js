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
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        product_type: {
            type: DataTypes.ENUM('simple', 'product_variants'),
        },
        thumbnail: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'archived', 'draft'),
            allowNull: false,
            defaultValue: 'active',
        },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        flag: {
            type: DataTypes.ENUM(
                'new',
                'popular',
                'featured',
                'none',
                'on_sale',
            ),
            allowNull: false,
            defaultValue: 'none',
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        min_stock: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        width: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        height: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        length: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        price_sale: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        sold: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        inventory_type: {
            type: DataTypes.ENUM('in_stock', 'out_of_stock', 'low_stock'),
            allowNull: false,
            defaultValue: 'in_stock',
        },
    };

    const options = {
        tableName: 'tb_product',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Product = sequelize.define('Product', attributes, options);

    return Product;
};
