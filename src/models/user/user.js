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
        user_login: {
            type: DataTypes.STRING(60),
            allowNull: false,
            unique: true,
        },
        user_pass: {
            type: DataTypes.STRING(255),
            allowNull: true, // Allow null for Google OAuth users
        },
        user_nickname: {
            type: DataTypes.STRING(60),
            allowNull: true,
        },
        user_email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        user_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        user_registered: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        user_status: {
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
        user_date_of_birth: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        email_verification_code: {
            type: DataTypes.STRING(6),
            allowNull: true,
        },
        email_verification_expires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        google_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_user',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const User = sequelize.define('User', attributes, options);

    return User;
}
