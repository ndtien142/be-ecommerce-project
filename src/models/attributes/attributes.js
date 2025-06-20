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
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
    };

    const options = {
        tableName: 'tb_attributes',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Attribute = sequelize.define('Attribute', attributes, options);

    return Attribute;
};
