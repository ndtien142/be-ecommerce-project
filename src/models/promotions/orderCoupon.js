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
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tb_order',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        coupon_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tb_coupons',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        user_coupon_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'tb_user_coupons',
                key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Liên kết với user coupon nếu là voucher cá nhân',
        },
        // Thông tin sử dụng
        coupon_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Mã được sử dụng (lưu lại để tracking)',
        },
        // Giá trị áp dụng
        discount_type: {
            type: DataTypes.ENUM('percent', 'fixed', 'free_shipping'),
            allowNull: false,
            comment: 'Loại giảm giá được áp dụng',
        },
        discount_value: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Giá trị giảm được áp dụng',
        },
        discount_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Số tiền thực tế được giảm',
        },
        // Thông tin đơn hàng tại thời điểm áp dụng
        order_subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Tổng tiền đơn hàng trước giảm giá',
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Phí ship trước giảm giá',
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Số tiền giảm phí ship',
        },
        // Metadata
        applied_products: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách sản phẩm được áp dụng giảm giá',
        },
        conditions_met: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Thông tin điều kiện được thỏa mãn',
        },
    };

    const options = {
        tableName: 'tb_order_coupons',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
        indexes: [
            {
                unique: true,
                fields: ['order_id', 'coupon_id'],
            },
            {
                fields: ['coupon_code'],
            },
            {
                fields: ['discount_type'],
            },
        ],
    };

    const OrderCoupon = sequelize.define('OrderCoupon', attributes, options);

    return OrderCoupon;
};
