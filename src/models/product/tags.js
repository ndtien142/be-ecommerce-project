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
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
    };

    const options = {
        tableName: 'tb_tag',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Tag = sequelize.define('Tag', attributes, options);

    return Tag;
};
