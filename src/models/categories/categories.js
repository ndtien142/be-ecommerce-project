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
            unique: 'category_name_slug_unique',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: 'category_name_slug_unique',
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        image_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_categories',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Category = sequelize.define('Category', attributes, options);

    return Category;
};
