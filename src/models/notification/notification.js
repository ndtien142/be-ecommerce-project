'use strict';

const { DataTypes } = require('sequelize');

// Notification type enum for management and reuse
const NOTIFICATION_TYPE = {
    BORROW_RECEIPT_NOT_ENOUGH_EQUIPMENT: 'borrow_receipt_not_enough_equipment',
    IMPORT_RECEIPT_ERROR: 'import_receipt_error',
    IMPORT_RECEIPT_RETURN_REQUEST: 'import_receipt_return_request',
    LIQUIDATION_RECEIPT_APPROVED: 'liquidation_receipt_approved',
    TRANSFER_RECEIPT_COMPLETED: 'transfer_receipt_completed',
    GENERAL_ANNOUNCEMENT: 'general_announcement',
    // ...add more as needed
};

module.exports = model;
module.exports.NOTIFICATION_TYPE = NOTIFICATION_TYPE;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Main user who triggered or is most relevant to the notification',
        },
        receivers: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of user codes who will receive the notification (specific users or all users of a role)',
        },
        roles: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of role codes to send notification to all users of these roles',
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING(1000),
            allowNull: false,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        /**
         * type: The business type or reason for the notification.
         * See NOTIFICATION_TYPE for all supported values.
         */
        type: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM('borrow', 'import', 'transfer', 'liquidation'),
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_notification',
        freezeTableName: true,
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Notification = sequelize.define('Notification', attributes, options);

    return Notification;
}
