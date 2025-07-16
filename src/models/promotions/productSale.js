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
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tb_product',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        // Thông tin sale
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            comment: 'Tên đợt giảm giá',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Mô tả đợt giảm giá',
        },
        // Loại giảm giá
        discount_type: {
            type: DataTypes.ENUM('percent', 'fixed'),
            allowNull: false,
            comment: 'Loại giảm giá: percent(%), fixed(VND)',
        },
        discount_value: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Giá trị giảm',
        },
        // Giá gốc và giá sale
        original_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Giá gốc tại thời điểm tạo sale',
        },
        sale_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'Giá sau khi giảm',
        },
        // Thời gian
        start_date: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Ngày bắt đầu sale',
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Ngày kết thúc sale',
        },
        // Trạng thái
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        // Giới hạn số lượng
        quantity_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Số lượng sản phẩm sale tối đa (null = không giới hạn)',
        },
        sold_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Số lượng đã bán với giá sale',
        },
        // Điều kiện
        min_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Số lượng tối thiểu để áp dụng giá sale',
        },
        max_quantity_per_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Số lượng tối đa mỗi user có thể mua với giá sale',
        },
        // Metadata
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID admin tạo sale',
        },
        campaign_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'ID chiến dịch (VD: FLASH_SALE_2024, BLACK_FRIDAY)',
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Tags để group các sale (flash_sale, seasonal, clearance)',
        },
        priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Độ ưu tiên (số càng cao càng ưu tiên)',
        },
    };

    const options = {
        tableName: 'tb_product_sales',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
        indexes: [
            {
                fields: ['product_id'],
            },
            {
                fields: ['is_active'],
            },
            {
                fields: ['start_date', 'end_date'],
            },
            {
                fields: ['campaign_id'],
            },
            {
                fields: ['priority'],
            },
        ],
    };

    const ProductSale = sequelize.define('ProductSale', attributes, options);

    return ProductSale;
};
