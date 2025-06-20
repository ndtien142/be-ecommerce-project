'use strict';

const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        permission_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        permission_description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
    };

    const options = {
        tableName: 'tb_permission',
        timestamps: false,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Permission = sequelize.define('Permission', attributes, options);

    return Permission;
}
