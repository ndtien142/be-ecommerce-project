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
            type: DataTypes.ENUM('active', 'inactive', 'archived'),
            allowNull: false,
            defaultValue: 'active',
        },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
