'use strict';

const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.TINYINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            // unique: true,
        },
        description: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.ENUM(
                'normal',
                'pending',
                'blocked',
                'deleted',
                'suspended',
            ),
            allowNull: false,
            defaultValue: 'normal',
        },
    };

    const options = {
        tableName: 'tb_role',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    return sequelize.define('Role', attributes, options);
}
