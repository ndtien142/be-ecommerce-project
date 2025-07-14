'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OrderLog = sequelize.define(
        'OrderLog',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tb_order',
                    key: 'id',
                },
            },
            from_status: {
                type: DataTypes.ENUM(
                    'pending_confirmation',
                    'pending_pickup',
                    'shipping',
                    'delivered',
                    'customer_confirmed', // Khách hàng xác nhận đã nhận hàng
                    'returned',
                    'cancelled',
                ),
                allowNull: true, // null khi tạo đơn mới
            },
            to_status: {
                type: DataTypes.ENUM(
                    'pending_confirmation',
                    'pending_pickup',
                    'shipping',
                    'delivered',
                    'customer_confirmed', // Khách hàng xác nhận đã nhận hàng
                    'returned',
                    'cancelled',
                ),
                allowNull: false,
            },
            action: {
                type: DataTypes.ENUM(
                    'created', // Tạo đơn hàng
                    'confirmed', // Xác nhận đơn hàng
                    'picked_up', // Lấy hàng
                    'shipped', // Bắt đầu giao hàng
                    'delivered', // Shipper giao thành công
                    'customer_confirmed', // Khách hàng xác nhận nhận hàng
                    'returned', // Trả hàng
                    'cancelled', // Hủy đơn
                    'cod_completed', // Hoàn tất COD
                    'payment_completed', // Thanh toán hoàn tất
                    'refunded', // Hoàn tiền
                ),
                allowNull: false,
            },
            actor_type: {
                type: DataTypes.ENUM(
                    'system', // Hệ thống tự động
                    'admin', // Admin xử lý
                    'customer', // Khách hàng
                    'shipper', // Shipper
                    'payment_gateway', // Cổng thanh toán
                ),
                allowNull: false,
            },
            actor_id: {
                type: DataTypes.INTEGER,
                allowNull: true, // null khi system hoặc payment_gateway
            },
            actor_name: {
                type: DataTypes.STRING,
                allowNull: true, // Tên người thực hiện
            },
            note: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true, // Lưu thông tin bổ sung (tracking_number, payment_id, etc.)
            },
            ip_address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'tb_order_log',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    fields: ['order_id'],
                },
                {
                    fields: ['order_id', 'created_at'],
                },
                {
                    fields: ['actor_type', 'actor_id'],
                },
                {
                    fields: ['action'],
                },
            ],
        },
    );

    return OrderLog;
};
