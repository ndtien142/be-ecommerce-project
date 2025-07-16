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
            references: {
                model: 'tb_user',
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
        // Thông tin personalized
        personal_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
            comment: 'Mã cá nhân hóa cho user (VD: WELCOME_USER123)',
        },
        gift_message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Lời nhắn khi tặng voucher',
        },
        // Trạng thái sử dụng
        used_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Số lần user đã sử dụng coupon này',
        },
        max_usage: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Số lần tối đa user có thể sử dụng',
        },
        // Thời gian hiệu lực riêng (override coupon chính)
        valid_from: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Ngày bắt đầu có hiệu lực cho user này',
        },
        valid_until: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Ngày hết hiệu lực cho user này',
        },
        // Trạng thái
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        source: {
            type: DataTypes.ENUM(
                'system_reward',
                'admin_gift',
                'event_reward',
                'referral_bonus',
                'loyalty_point',
            ),
            allowNull: false,
            defaultValue: 'system_reward',
            comment: 'Nguồn gốc voucher',
        },
        // Thông tin sử dụng
        first_used_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Lần đầu sử dụng',
        },
        last_used_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Lần cuối sử dụng',
        },
        // Metadata
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Thông tin bổ sung (event_id, referral_id, etc.)',
        },
    };

    const options = {
        tableName: 'tb_user_coupons',
        timestamps: true,
        createdAt: 'create_time',
        updatedAt: 'update_time',
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'coupon_id'],
            },
            {
                unique: true,
                fields: ['personal_code'],
                where: {
                    personal_code: {
                        [sequelize.Sequelize.Op.ne]: null,
                    },
                },
            },
            {
                fields: ['is_active'],
            },
            {
                fields: ['valid_from', 'valid_until'],
            },
        ],
    };

    const UserCoupon = sequelize.define('UserCoupon', attributes, options);

    return UserCoupon;
};
