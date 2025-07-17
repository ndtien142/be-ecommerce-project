'use strict';

const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: 'user_id_unique', // Ensure user_id is unique
        },
        privateKey: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        publicKey: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    };

    const options = {
        tableName: 'tb_key_token',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const KeyToken = sequelize.define('KeyToken', attributes, options);

    return KeyToken;
}
