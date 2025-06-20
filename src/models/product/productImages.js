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
        image_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    };

    const options = {
        tableName: 'tb_product_images',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const ProductImage = sequelize.define('ProductImage', attributes, options);

    return ProductImage;
};
