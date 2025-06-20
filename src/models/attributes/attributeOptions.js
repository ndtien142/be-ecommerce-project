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
        attribute_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    };

    const options = {
        tableName: 'tb_attribute_options',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const AttributeOption = sequelize.define(
        'AttributeOption',
        attributes,
        options,
    );

    return AttributeOption;
};
