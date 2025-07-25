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
        address_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        payment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(
                'pending_confirmation', // Chờ xác nhận
                'pending_pickup', // Chờ lấy hàng
                'shipping', // Đang giao hàng
                'delivered', // Shipper đã giao
                'customer_confirmed', // Khách hàng xác nhận đã nhận
                'returned', // Trả hàng (hoàn toàn)
                'cancelled', // Đã hủy
            ),
            allowNull: false,
            defaultValue: 'pending_confirmation',
        },
        // Thông tin giá tiền
        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Tổng tiền sản phẩm chưa tính giảm giá',
        },
        discount_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Tổng tiền giảm giá từ coupon',
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Tiền giảm phí ship',
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Tổng tiền sau khi trừ tất cả giảm giá',
        },
        // Thông tin coupon
        coupon_codes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách mã coupon đã sử dụng',
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ordered_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        shipped_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        delivered_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        customer_confirmed_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        shipping_method_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        tracking_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        shipped_by: {
            type: DataTypes.STRING, // tên người giao hàng (nếu có)
            allowNull: true,
        },
    };

    const options = {
        tableName: 'tb_order',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
    };

    const Order = sequelize.define('Order', attributes, options);

    return Order;
};
