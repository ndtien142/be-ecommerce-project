'use strict';

const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        user_code: {
            type: DataTypes.STRING(20),
            primaryKey: true,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(255),
            allowNull: false,
            // unique: true,
        },
        password: { type: DataTypes.STRING(255), allowNull: false },
        role_id: {
            type: DataTypes.TINYINT,
            allowNull: false,
            references: { model: 'tb_role', key: 'id' },
        },
        email: { type: DataTypes.STRING(255), allowNull: true },
        phone_number: { type: DataTypes.STRING(20), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false },
        is_block: { type: DataTypes.BOOLEAN, allowNull: false },
    };

    const options = {
        tableName: 'tb_account',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Account = sequelize.define('Account', attributes, options);

    return Account;
}
