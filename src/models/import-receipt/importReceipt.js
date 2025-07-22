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
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        receipt_code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: 'import_receipt_code_unique',
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        import_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_import_receipt',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const ImportReceipt = sequelize.define(
        'ImportReceipt',
        attributes,
        options,
    );

    return ImportReceipt;
};
