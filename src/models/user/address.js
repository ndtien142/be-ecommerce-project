'use strict';

const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'tb_user', key: 'id' },
        },
        country: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        ward: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        street: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        street_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        receiver_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'archived'),
            allowNull: false,
            defaultValue: 'active',
        },
    };

    const options = {
        tableName: 'tb_user_address',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const UserAddress = sequelize.define('UserAddress', attributes, options);

    return UserAddress;
}
