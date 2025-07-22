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
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: 'coupon_code_unique',
            comment: 'Mã giảm giá (VD: WELCOME50, NEWYEAR2024)',
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            comment: 'Tên mã giảm giá',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả mã giảm giá',
        },
        type: {
            type: DataTypes.ENUM('percent', 'fixed', 'free_shipping'),
            allowNull: false,
            comment:
                'Loại giảm giá: percent(%), fixed(VND), free_shipping(miễn phí ship)',
        },
        value: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.0,
            comment: 'Giá trị giảm (% hoặc VND)',
        },
        min_order_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            comment: 'Giá trị đơn hàng tối thiểu để áp dụng',
        },
        max_discount_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            comment: 'Số tiền giảm tối đa (cho loại percent)',
        },
        usage_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Số lần sử dụng tối đa (null = không giới hạn)',
        },
        used_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Số lần đã sử dụng',
        },
        usage_limit_per_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment: 'Số lần mỗi user có thể sử dụng',
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Ngày bắt đầu có hiệu lực',
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Ngày hết hiệu lực',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Trạng thái hoạt động',
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID admin tạo coupon',
        },
        // Điều kiện áp dụng
        applicable_products: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách ID sản phẩm áp dụng (null = tất cả)',
        },
        applicable_categories: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách ID danh mục áp dụng (null = tất cả)',
        },
        excluded_products: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách ID sản phẩm loại trừ',
        },
        excluded_categories: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách ID danh mục loại trừ',
        },
        // Điều kiện user
        first_order_only: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Chỉ áp dụng cho đơn hàng đầu tiên',
        },
        applicable_user_groups: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Danh sách ID nhóm user áp dụng (null = tất cả)',
        },
    };

    const options = {
        tableName: 'tb_coupons',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
        indexes: [
            {
                unique: 'coupon_code_unique',
                fields: ['code'],
            },
            {
                fields: ['is_active'],
            },
            {
                fields: ['start_date', 'end_date'],
            },
        ],
    };

    const Coupon = sequelize.define('Coupon', attributes, options);

    return Coupon;
};
