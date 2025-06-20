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
        import_receipt_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sku_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
    };

    const options = {
        tableName: 'tb_import_receipt_detail',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const ImportReceiptDetail = sequelize.define(
        'ImportReceiptDetail',
        attributes,
        options,
    );

    return ImportReceiptDetail;
};
