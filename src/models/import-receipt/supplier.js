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
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
        },
        contact_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        address: {
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
        tableName: 'tb_supplier',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Supplier = sequelize.define('Supplier', attributes, options);

    return Supplier;
};
