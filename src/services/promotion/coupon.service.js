'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const { Op } = require('sequelize');
const database = require('../../models');
const { toCamel } = require('../../utils/common.utils');
const { toSnake } = require('../../utils/caseConverter');

class CouponService {
    // ===== COUPON MANAGEMENT =====

    /**
     * Tạo mã giảm giá mới
     */
    static async createCoupon({
        code,
        name,
        description,
        type,
        value,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        usageLimitPerUser,
        startDate,
        endDate,
        applicableProducts,
        applicableCategories,
        excludedProducts = [],
        excludedCategories = [],
        firstOrderOnly,
        applicableUserGroups = [],
        createdBy,
    }) {
        // Validate input
        if (!code || !name || !type || (type !== 'free_shipping' && !value)) {
            throw new BadRequestError('Missing required fields');
        }

        if (!['percent', 'fixed', 'free_shipping'].includes(type)) {
            throw new BadRequestError('Invalid discount type');
        }

        if (type === 'percent' && (value < 0 || value > 100)) {
            throw new BadRequestError(
                'Percent discount must be between 0 and 100',
            );
        }

        if (type === 'fixed' && value < 0) {
            throw new BadRequestError('Fixed discount must be positive');
        }

        // Check if coupon code already exists
        const existingCoupon = await database.Coupon.findOne({
            where: { code: code.toUpperCase() },
        });

        if (existingCoupon) {
            throw new BadRequestError('Coupon code already exists');
        }

        // Set default value for free_shipping type
        const couponValue = type === 'free_shipping' ? 0 : value;

        // Create coupon
        const coupon = await database.Coupon.create({
            code: code.toUpperCase(),
            name,
            description,
            type,
            value: couponValue,
            min_order_amount: minOrderAmount || null,
            max_discount_amount: maxDiscountAmount || null,
            usage_limit: usageLimit || null,
            usage_limit_per_user: usageLimitPerUser || 1,
            start_date: startDate || null,
            end_date: endDate || null,
            applicable_products: applicableProducts || null,
            applicable_categories: applicableCategories || null,
            excluded_products: excludedProducts || null,
            excluded_categories: excludedCategories || null,
            first_order_only: firstOrderOnly || false,
            applicable_user_groups: applicableUserGroups || null,
            created_by: createdBy,
        });

        return toCamel(coupon.toJSON());
    }

    /**
     * Lấy danh sách coupon với phân trang
     */
    static async getCoupons(camelOptions = {}) {
        // Convert camelCase to snake_case
        const options = toSnake(camelOptions);

        const {
            page = 1,
            limit = 10,
            is_active,
            type,
            code,
            start_date,
            end_date,
        } = options;

        const whereConditions = {};

        if (is_active !== undefined) {
            whereConditions.is_active = is_active;
        }

        if (type) {
            whereConditions.type = type;
        }

        if (code) {
            whereConditions.code = {
                [Op.iLike]: `%${code}%`,
            };
        }

        if (start_date || end_date) {
            whereConditions[Op.and] = [];
            if (start_date) {
                whereConditions[Op.and].push({
                    [Op.or]: [
                        { start_date: { [Op.gte]: start_date } },
                        { start_date: null },
                    ],
                });
            }
            if (end_date) {
                whereConditions[Op.and].push({
                    [Op.or]: [
                        { end_date: { [Op.lte]: end_date } },
                        { end_date: null },
                    ],
                });
            }
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await database.Coupon.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [['create_time', 'DESC']],
        });

        return {
            items: toCamel(rows.map((row) => row.toJSON())),
            meta: {
                totalItems: count,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Lấy chi tiết coupon
     */
    static async getCouponById(id) {
        const coupon = await database.Coupon.findByPk(id);
        if (!coupon) {
            throw new NotFoundError('Coupon not found');
        }
        return toCamel(coupon.toJSON());
    }

    /**
     * Cập nhật coupon
     */
    static async updateCoupon({
        id,
        code,
        name,
        description,
        type,
        value,
        minOrderAmount,
        maxOrderAmount,
        usageLimit,
        usageLimitPerUser,
        startDate,
        endDate,
        applicableProducts = [],
        applicableCategories = [],
        excludedProducts = [],
        excludedCategories = [],
        firstOrderOnly,
        applicableUserGroups = [],
        createdBy,
    }) {
        // Find coupon
        const coupon = await database.Coupon.findByPk(id);
        if (!coupon) {
            throw new NotFoundError('Coupon not found');
        }

        // Prepare update data
        const updateData = {};

        // Validate and update code
        if (code && code !== coupon.code) {
            const existingCoupon = await database.Coupon.findOne({
                where: {
                    code: code.toUpperCase(),
                    id: { [Op.ne]: id },
                },
            });
            if (existingCoupon) {
                throw new BadRequestError('Coupon code already exists');
            }
            updateData.code = code.toUpperCase();
        }

        // Validate type
        if (type && !['percent', 'fixed', 'free_shipping'].includes(type)) {
            throw new BadRequestError('Invalid discount type');
        }

        // Validate value
        if (
            type === 'percent' ||
            (type === undefined && coupon.type === 'percent')
        ) {
            const percentValue = value !== undefined ? value : coupon.value;
            if (percentValue < 0 || percentValue > 100) {
                throw new BadRequestError(
                    'Percent discount must be between 0 and 100',
                );
            }
        }
        if (
            type === 'fixed' ||
            (type === undefined && coupon.type === 'fixed')
        ) {
            const fixedValue = value !== undefined ? value : coupon.value;
            if (fixedValue < 0) {
                throw new BadRequestError('Fixed discount must be positive');
            }
        }

        // Set fields if provided
        if (name !== undefined && name !== null) updateData.name = name;
        if (description !== undefined && description !== null)
            updateData.description = description;
        if (type !== undefined && type !== null) updateData.type = type;
        if (value !== undefined && value !== null)
            updateData.value = type === 'free_shipping' ? 0 : value;
        if (minOrderAmount !== undefined && minOrderAmount !== null)
            updateData.min_order_amount = minOrderAmount;
        if (maxOrderAmount !== undefined && maxOrderAmount !== null)
            updateData.max_discount_amount = maxOrderAmount;
        if (usageLimit !== undefined && usageLimit !== null)
            updateData.usage_limit = usageLimit;
        if (usageLimitPerUser !== undefined && usageLimitPerUser !== null)
            updateData.usage_limit_per_user = usageLimitPerUser;
        if (startDate !== undefined && startDate !== null)
            updateData.start_date = startDate;
        if (endDate !== undefined && endDate !== null)
            updateData.end_date = endDate;
        if (applicableProducts !== undefined && applicableProducts !== null)
            updateData.applicable_products = applicableProducts;
        if (applicableCategories !== undefined && applicableCategories !== null)
            updateData.applicable_categories = applicableCategories;
        if (excludedProducts !== undefined && excludedProducts !== null)
            updateData.excluded_products = excludedProducts;
        if (excludedCategories !== undefined && excludedCategories !== null)
            updateData.excluded_categories = excludedCategories;
        if (firstOrderOnly !== undefined && firstOrderOnly !== null)
            updateData.first_order_only = firstOrderOnly;
        if (applicableUserGroups !== undefined && applicableUserGroups !== null)
            updateData.applicable_user_groups = applicableUserGroups;
        if (createdBy !== undefined && createdBy !== null)
            updateData.created_by = createdBy;

        console.log('Update data:', updateData);

        await coupon.update(updateData);
        return toCamel(coupon.toJSON());
    }

    // ===== COUPON STATUS MANAGEMENT =====
    static async toggleCouponStatus(id, isActive) {
        const coupon = await database.Coupon.findByPk(id);
        if (!coupon) {
            throw new NotFoundError('Coupon not found');
        }
        await coupon.update({ is_active: isActive });
        return toCamel(coupon.toJSON());
    }

    /**
     * Xóa coupon
     */
    static async deleteCoupon(id) {
        const coupon = await database.Coupon.findByPk(id);
        if (!coupon) {
            throw new NotFoundError('Coupon not found');
        }

        // Check if coupon has been used
        const usageCount = await database.OrderCoupon.count({
            where: { coupon_id: id },
        });

        if (usageCount > 0) {
            throw new BadRequestError(
                'Cannot delete coupon that has been used',
            );
        }

        await coupon.destroy();
        return { message: 'Coupon deleted successfully' };
    }

    // ===== USER COUPON MANAGEMENT =====

    /**
     * Tặng coupon cho user
     */
    static async grantCouponToUser(camelData) {
        // Convert camelCase to snake_case for database
        const data = toSnake(camelData);

        const {
            user_id,
            coupon_id,
            personal_code,
            gift_message,
            max_usage = 1,
            valid_from,
            valid_until,
            source = 'system_reward',
            metadata,
        } = data;

        // Validate required fields
        if (!user_id || !coupon_id) {
            throw new BadRequestError('user_id and coupon_id are required');
        }

        // Validate coupon exists
        const coupon = await database.Coupon.findByPk(coupon_id);
        if (!coupon) {
            throw new NotFoundError('Coupon not found');
        }

        // Validate user exists
        const user = await database.User.findByPk(user_id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Check if user already has this coupon
        const existingUserCoupon = await database.UserCoupon.findOne({
            where: { user_id, coupon_id },
        });

        if (existingUserCoupon) {
            throw new BadRequestError('User already has this coupon');
        }

        // Create user coupon
        const userCoupon = await database.UserCoupon.create({
            user_id,
            coupon_id,
            personal_code,
            gift_message,
            max_usage,
            valid_from,
            valid_until,
            source,
            metadata,
        });

        return toCamel(userCoupon.toJSON());
    }

    /**
     * Lấy danh sách coupon của user
     */
    static async getUserCoupons(user_id, camelOptions = {}) {
        // Validate user_id
        if (!user_id || user_id === undefined) {
            throw new BadRequestError('user_id is required');
        }

        // Convert camelCase to snake_case
        const options = toSnake(camelOptions);

        const {
            page = 1,
            limit = 10,
            is_active,
            is_available_only = false,
        } = options;

        const whereConditions = { user_id };

        if (is_active !== undefined) {
            whereConditions.is_active = is_active;
        }

        // Filter available coupons only
        if (is_available_only) {
            const now = new Date();
            whereConditions[Op.and] = [
                { is_active: true },
                {
                    [Op.or]: [
                        { valid_from: null },
                        { valid_from: { [Op.lte]: now } },
                    ],
                },
                {
                    [Op.or]: [
                        { valid_until: null },
                        { valid_until: { [Op.gte]: now } },
                    ],
                },
                // Still has usage left - specify table alias
                database.sequelize.literal(
                    '`UserCoupon`.`used_count` < `UserCoupon`.`max_usage`',
                ),
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await database.UserCoupon.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: database.Coupon,
                    as: 'coupon',
                    where: is_available_only ? { is_active: true } : undefined,
                },
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['create_time', 'DESC']],
        });

        return {
            items: toCamel(rows.map((row) => row.toJSON())),
            meta: {
                totalItems: count,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * lấy danh sách coupon hệ thống hợp lệ
     */
    static async getAvailableSystemCoupon(user_id, camelOptions = {}) {
        // Validate user_id
        if (!user_id || user_id === undefined) {
            throw new BadRequestError('user_id is required');
        }

        // const foundCart = database.Cart.findByPk(cartId, {
        //     include: [
        //         {
        //             model: database.CartItem,
        //             as: 'lineItems',
        //         },
        //     ],
        // });

        // Convert camelCase to snake_case
        const options = toSnake(camelOptions);

        const {
            page = 1,
            limit = 10,
            is_active,
            is_available_only = false,
        } = options;

        const whereConditions = { user_id };

        if (is_active !== undefined) {
            whereConditions.is_active = is_active;
        }

        // Filter available coupons only
        if (is_available_only) {
            const now = new Date();
            whereConditions[Op.and] = [
                { is_active: true },
                {
                    [Op.or]: [
                        { valid_from: null },
                        { valid_from: { [Op.lte]: now } },
                    ],
                },
                {
                    [Op.or]: [
                        { valid_until: null },
                        { valid_until: { [Op.gte]: now } },
                    ],
                },
                // Still has usage left - specify table alias
                database.sequelize.literal(
                    '`UserCoupon`.`used_count` < `UserCoupon`.`max_usage`',
                ),
            ];
        }

        const offset = (page - 1) * limit;

        const { count: couponSystemCount, rows: couponSystemRows } =
            await database.Coupon.findAndCountAll({
                where: {
                    is_active: true,
                },
                limit: parseInt(limit),
                offset: offset,
                order: [['create_time', 'DESC']],
            });

        return {
            items: toCamel(couponSystemRows.map((row) => row.toJSON())),
            meta: {
                totalItems: couponSystemCount,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                totalPages: Math.ceil(couponSystemCount / limit),
            },
        };
    }

    // ===== COUPON VALIDATION & APPLICATION =====

    /**
     * Validate coupon system có thể sử dụng không
     */
    static async validateCoupon(code, user_id, camelOrderData) {
        // Validate inputs
        if (!code) {
            throw new BadRequestError('Coupon code is required');
        }

        // Convert camelCase to snake_case
        const order_data = toSnake(camelOrderData);

        const coupon = await database.Coupon.findOne({
            where: {
                code: code.toUpperCase(),
                is_active: true,
            },
        });

        if (!coupon) {
            throw new NotFoundError('Coupon not found or inactive');
        }

        const now = new Date();

        // Check time validity
        if (coupon.start_date && coupon.start_date > now) {
            throw new BadRequestError('Coupon not yet valid');
        }

        if (coupon.end_date && coupon.end_date < now) {
            throw new BadRequestError('Coupon has expired');
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            throw new BadRequestError('Coupon usage limit exceeded');
        }

        // Check user specific limitations
        if (user_id) {
            const userCouponUsage = await database.OrderCoupon.count({
                where: { coupon_id: coupon.id },
                include: [
                    {
                        model: database.Order,
                        as: 'order',
                        where: { user_id },
                    },
                ],
            });

            if (
                coupon.usage_limit_per_user &&
                userCouponUsage >= coupon.usage_limit_per_user
            ) {
                throw new BadRequestError(
                    'User has exceeded coupon usage limit',
                );
            }

            // Check first order only
            if (coupon.first_order_only) {
                const userOrderCount = await database.Order.count({
                    where: {
                        user_id,
                        status: { [Op.ne]: 'cancelled' },
                    },
                });

                if (userOrderCount > 0) {
                    throw new BadRequestError(
                        'Coupon is only valid for first order',
                    );
                }
            }
        }

        // Check minimum order amount
        if (
            coupon.min_order_amount &&
            order_data.subtotal < coupon.min_order_amount
        ) {
            throw new BadRequestError(
                `Minimum order amount is ${coupon.min_order_amount}`,
            );
        }

        // Check applicable products/categories
        if (order_data.items && order_data.items.length > 0) {
            const validationResult = await this.validateCouponProducts(
                coupon,
                order_data.items,
            );
            if (!validationResult.isValid) {
                throw new BadRequestError(validationResult.message);
            }
        }

        return toCamel(coupon.toJSON());
    }

    /**
     * Validate coupon có áp dụng được cho sản phẩm không
     */
    static async validateCouponProducts(coupon, orderItems) {
        // If no restrictions, coupon applies to all products
        if (
            !coupon.applicable_products &&
            !coupon.applicable_categories &&
            !coupon.excluded_products &&
            !coupon.excluded_categories
        ) {
            return { isValid: true };
        }

        const productIds = orderItems.map((item) => item.product_id);

        // Get products with categories
        const products = await database.Product.findAll({
            where: { id: productIds },
            include: [
                {
                    model: database.Category,
                    as: 'categories',
                    through: { attributes: [] },
                },
            ],
        });

        // Check excluded products
        if (coupon.excluded_products && coupon.excluded_products.length > 0) {
            const hasExcludedProduct = productIds.some((id) =>
                coupon.excluded_products.includes(id),
            );
            if (hasExcludedProduct) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá không áp dụng cho sản phẩm bị loại trừ',
                };
            }
        }

        // Check excluded categories
        if (
            coupon.excluded_categories &&
            coupon.excluded_categories.length > 0
        ) {
            const hasExcludedCategory = products.some((product) =>
                product.categories.some((category) =>
                    coupon.excluded_categories.includes(category.id),
                ),
            );
            if (hasExcludedCategory) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá không áp dụng cho sản phẩm thuộc danh mục bị loại trừ',
                };
            }
        }

        // Check applicable products
        if (
            coupon.applicable_products &&
            coupon.applicable_products.length > 0
        ) {
            const hasApplicableProduct = productIds.some((id) =>
                coupon.applicable_products.includes(id),
            );
            if (!hasApplicableProduct) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá chỉ áp dụng cho một số sản phẩm nhất định',
                };
            }
        }

        // Check applicable categories
        if (
            coupon.applicable_categories &&
            coupon.applicable_categories.length > 0
        ) {
            const hasApplicableCategory = products.some((product) =>
                product.categories.some((category) =>
                    coupon.applicable_categories.includes(category.id),
                ),
            );
            if (!hasApplicableCategory) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá chỉ áp dụng cho một số danh mục nhất định',
                };
            }
        }

        return { isValid: true };
    }

    /**
     * Tính toán discount amount
     */
    static calculateDiscount(coupon, camelOrderData) {
        // Convert camelCase to snake_case
        const order_data = toSnake(camelOrderData);

        let discountAmount = 0;
        let shippingDiscount = 0;

        if (coupon.type === 'percent') {
            discountAmount = (order_data.subtotal * coupon.value) / 100;
            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(
                    discountAmount,
                    coupon.maxDiscountAmount,
                );
            }
        } else if (coupon.type === 'fixed') {
            discountAmount = Math.min(coupon.value, order_data.subtotal);
        } else if (coupon.type === 'free_shipping') {
            shippingDiscount = order_data.shipping_fee || 0;
        }

        return {
            discountAmount: Math.round(discountAmount * 100) / 100,
            shippingDiscount: Math.round(shippingDiscount * 100) / 100,
        };
    }

    /**
     * Áp dụng coupon vào order
     */
    static async applyCouponToOrder(
        order_id,
        coupon_id,
        user_coupon_id,
        camelDiscountData,
        transaction, // thêm transaction param
    ) {
        console.log('Applying coupon to order:', {
            order_id,
            coupon_id,
            user_coupon_id,
            camelDiscountData,
        });
        // Convert camelCase to snake_case
        const discount_data = toSnake(camelDiscountData);

        // Ép kiểu về số cho các trường số
        const discountValue = Number(discount_data.discount_value);
        const discountAmount = Number(discount_data.discount_amount);
        const orderSubtotal = Number(discount_data.order_subtotal);
        const shippingFee = Number(discount_data.shipping_fee);
        const shippingDiscount = Number(discount_data.shipping_discount);

        // Chuẩn hóa conditions_met từ dữ liệu truyền vào (ưu tiên dữ liệu truyền vào)
        let rawConditionsMet = discount_data.conditions_met || {};
        const conditionsMet = {
            min_order_amount:
                rawConditionsMet.min_order_amount !== undefined &&
                rawConditionsMet.min_order_amount !== null
                    ? Number(rawConditionsMet.min_order_amount)
                    : 0,
            applicable_products: Array.isArray(
                rawConditionsMet.applicable_products,
            )
                ? rawConditionsMet.applicable_products
                : [],
            applicable_categories: Array.isArray(
                rawConditionsMet.applicable_categories,
            )
                ? rawConditionsMet.applicable_categories
                : [],
        };

        // Log dữ liệu chuẩn bị lưu
        console.log('OrderCoupon create data:', {
            order_id,
            coupon_id,
            user_coupon_id,
            coupon_code: discount_data.coupon_code,
            discount_type: discount_data.discount_type,
            discount_value: discountValue,
            discount_amount: discountAmount,
            order_subtotal: orderSubtotal,
            shipping_fee: shippingFee,
            shipping_discount: shippingDiscount,
            applied_products: discount_data.applied_products,
            conditions_met: conditionsMet,
        });

        console.log('Before OrderCoupon.create');
        let orderCoupon;
        try {
            orderCoupon = await database.OrderCoupon.create(
                {
                    order_id,
                    coupon_id,
                    user_coupon_id,
                    coupon_code: discount_data.coupon_code,
                    discount_type: discount_data.discount_type,
                    discount_value: discountValue,
                    discount_amount: discountAmount,
                    order_subtotal: orderSubtotal,
                    shipping_fee: shippingFee,
                    shipping_discount: shippingDiscount,
                    applied_products: discount_data.applied_products || [],
                    conditions_met: conditionsMet,
                },
                transaction ? { transaction } : undefined,
            );
            console.log('OrderCoupon.create success');
        } catch (err) {
            console.error('OrderCoupon create error:', err);
            throw err;
        }

        // Update coupon usage count
        await database.Coupon.increment('used_count', {
            where: { id: coupon_id },
            ...(transaction ? { transaction } : {}),
        });

        // Update user coupon usage
        if (user_coupon_id) {
            const [userCoupon, created] =
                await database.UserCoupon.findOrCreate({
                    where: { id: user_coupon_id },
                    ...(transaction ? { transaction } : {}),
                });
            await userCoupon.update(
                {
                    used_count: (userCoupon.used_count || 0) + 1,
                    first_used_at: userCoupon.first_used_at || new Date(),
                    last_used_at: new Date(),
                },
                transaction ? { transaction } : undefined,
            );
        }

        return orderCoupon;
    }
}

module.exports = CouponService;
