'use strict';

const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        first_name: { type: DataTypes.STRING(255), allowNull: false },
        last_name: { type: DataTypes.STRING(255), allowNull: false },
        avatar_url: { type: DataTypes.STRING(500) },
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        address: { type: DataTypes.TEXT, allowNull: false },
    };

    const options = {
        tableName: 'tb_profile',
        timestamps: true,
        createdAt: 'created_time',
        updatedAt: 'updated_time',
    };

    const Profile = sequelize.define('Profile', attributes, options);

    return Profile;
}
