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
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        },
        first_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        last_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        full_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        avatar_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        province: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        ward: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        postal_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_user_profile',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Profile = sequelize.define('Profile', attributes, options);

    return Profile;
};
