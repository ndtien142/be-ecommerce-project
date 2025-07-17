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
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: 'brand_name_unique', // Ensure brand names are unique
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        logo_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
    };

    const options = {
        tableName: 'tb_brand',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Brand = sequelize.define('Brand', attributes, options);

    return Brand;
};
