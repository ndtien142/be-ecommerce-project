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
        meta_key: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        meta_value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_product_meta',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const ProductMeta = sequelize.define('ProductMeta', attributes, options);

    return ProductMeta;
};
