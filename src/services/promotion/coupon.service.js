'use strict';

const { BadRequestError, NotFoundError } = require('../../core/error.response');
const { Op } = require('sequelize');
const { toCamel } = require('../../utils/common.utils');
const { toSnake } = require('../../utils/caseConverter');
const {
    createCouponSchema,
    updateCouponSchema,
} = require('../../schema/coupon.schema');
const { discountDataSchema } = require('../../schema/coupon-apply.schema');
const CouponRepo = require('../../repositories/coupon/coupon.repo');
const OrderCouponRepo = require('../../repositories/coupon/order-coupon.repo');
const ProductRepo = require('../../repositories/product/product.repo');
const CartService = require('../cart/cart.service');
const database = require('../../models');

class CouponService {
    // ===== COUPON MANAGEMENT =====
    static async createCoupon(payload) {
        const { error, value } = createCouponSchema.validate(payload);
        if (error) throw new BadRequestError(error.message);

        const code = value.code.toUpperCase();
        if (await CouponRepo.findByCode(code)) {
            throw new BadRequestError('Mã giảm giá đã tồn tại');
        }
        const couponValue = value.type === 'free_shipping' ? 0 : value.value;
        const coupon = await CouponRepo.createCoupon({
            ...value,
            code,
            value: couponValue,
            min_order_amount: value.minOrderAmount || null,
            max_discount_amount: value.maxDiscountAmount || null,
            usage_limit: value.usageLimit || null,
            usage_limit_per_user: value.usageLimitPerUser || 1,
            start_date: value.startDate || null,
            end_date: value.endDate || null,
            applicable_products: value.applicableProducts || null,
            applicable_categories: value.applicableCategories || null,
            excluded_products: value.excludedProducts || null,
            excluded_categories: value.excludedCategories || null,
            first_order_only: value.firstOrderOnly || false,
            applicable_user_groups: value.applicableUserGroups || null,
            created_by: value.createdBy,
        });
        return toCamel(coupon.toJSON());
    }

    static async getCoupons(
        options = { isActive: true, type: null, code: null },
    ) {
        const page = options.page || 1;
        const limit = options.limit || 10;
        const offset = (page - 1) * limit;
        const where = {};
        if (options.isActive !== undefined) where.is_active = options.isActive;
        if (options.type) where.type = options.type;
        if (options.code) where.code = { [Op.iLike]: `%${options.code}%` };

        const { count, rows } = await CouponRepo.findAndCountAll(
            where,
            limit,
            offset,
            [['create_time', 'DESC']],
        );

        return {
            items: toCamel(rows.map((r) => r.toJSON())),
            meta: {
                totalItems: count,
                currentPage: page,
                itemsPerPage: limit,
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    static async getCouponById(id) {
        const coupon = await CouponRepo.findById(id);
        if (!coupon) throw new NotFoundError('Không tìm thấy mã giảm giá');
        return toCamel(coupon.toJSON());
    }

    static async updateCoupon(payload) {
        const { error, value } = updateCouponSchema.validate(payload);
        if (error) throw new BadRequestError(error.message);

        const coupon = await CouponRepo.findById(value.id);
        if (!coupon) throw new NotFoundError('Không tìm thấy mã giảm giá');

        const updateData = {};
        if (value.code && value.code !== coupon.code) {
            if (await CouponRepo.findByCode(value.code.toUpperCase())) {
                throw new BadRequestError('Mã giảm giá đã tồn tại');
            }
            updateData.code = value.code.toUpperCase();
        }
        if (value.name !== undefined) updateData.name = value.name;
        if (value.description !== undefined)
            updateData.description = value.description;
        if (value.type !== undefined) updateData.type = value.type;
        if (value.value !== undefined)
            updateData.value = value.type === 'free_shipping' ? 0 : value.value;
        if (value.minOrderAmount !== undefined)
            updateData.min_order_amount = value.minOrderAmount;
        if (value.maxOrderAmount !== undefined)
            updateData.max_discount_amount = value.maxOrderAmount;
        if (value.usageLimit !== undefined)
            updateData.usage_limit = value.usageLimit;
        if (value.usageLimitPerUser !== undefined)
            updateData.usage_limit_per_user = value.usageLimitPerUser;
        if (value.startDate !== undefined)
            updateData.start_date = value.startDate;
        if (value.endDate !== undefined) updateData.end_date = value.endDate;
        if (value.applicableProducts !== undefined)
            updateData.applicable_products = value.applicableProducts;
        if (value.applicableCategories !== undefined)
            updateData.applicable_categories = value.applicableCategories;
        if (value.excludedProducts !== undefined)
            updateData.excluded_products = value.excludedProducts;
        if (value.excludedCategories !== undefined)
            updateData.excluded_categories = value.excludedCategories;
        if (value.firstOrderOnly !== undefined)
            updateData.first_order_only = value.firstOrderOnly;
        if (value.applicableUserGroups !== undefined)
            updateData.applicable_user_groups = value.applicableUserGroups;
        if (value.createdBy !== undefined)
            updateData.created_by = value.createdBy;

        await coupon.update(updateData);
        return toCamel(coupon.toJSON());
    }

    static async deleteCoupon(id) {
        const coupon = await CouponRepo.findById(id);
        if (!coupon) throw new NotFoundError('Không tìm thấy mã giảm giá');

        const usageCount = await OrderCouponRepo.count({
            where: { coupon_id: id },
        });
        if (usageCount > 0)
            throw new BadRequestError(
                'Không thể xóa mã giảm giá đã được sử dụng',
            );

        await coupon.destroy();
        return { message: 'Xóa mã giảm giá thành công' };
    }

    static async toggleCouponStatus(id, isActive) {
        const coupon = await CouponRepo.findById(id);
        if (!coupon) throw new NotFoundError('Không tìm thấy mã giảm giá');
        await coupon.update({ is_active: isActive });
        return toCamel(coupon.toJSON());
    }

    // ===== GET COUPONS VALID FOR CART =====
    static async getValidCouponsForCart({ userId }) {
        if (!userId) {
            throw new BadRequestError('Người dùng không hợp lệ');
        }

        const foundCartActive = await CartService.getCartsByUserId(userId);

        if (!foundCartActive) {
            throw new BadRequestError(
                'Giỏ hàng không hợp lệ hoặc không tồn tại',
            );
        }

        const coupons = await CouponRepo.findAllActiveCoupons();
        const productIds = foundCartActive.lineItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.product.price,
        }));
        const subTotal = foundCartActive.lineItems.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
        const products =
            await ProductRepo.findProductsByIdsWithCategories(productIds);

        const validCoupons = [];
        for (const coupon of coupons) {
            // Kiểm tra usage_limit_per_user
            let userUsageCount = 0;
            // Nếu coupon
            if (coupon.usage_limit_per_user && foundCartActive.userId) {
                userUsageCount = await OrderCouponRepo.count({
                    where: {
                        coupon_id: coupon.id,
                    },
                    include: [
                        {
                            model: database.Order,
                            as: 'order',
                            where: { user_id: foundCartActive.userId },
                        },
                    ],
                });
                // Nếu user đã dùng quá số lần cho phép
                if (userUsageCount >= coupon.usage_limit_per_user) {
                    continue; // Bỏ qua coupon này nếu user đã dùng quá số lần cho phép
                }
            }
            const ok = await this.isCouponValidForCart(
                coupon,
                {
                    userId: foundCartActive.user_id,
                    subtotal: subTotal,
                    items: productIds,
                    shippingFee: 0,
                },
                products,
            );
            if (ok) validCoupons.push(toCamel(coupon.toJSON()));
        }
        return validCoupons;
    }

    static async isCouponValidForCart(coupon, cartInfo, productList) {
        const now = new Date();
        if (coupon.start_date && coupon.start_date > now) return false;
        if (coupon.end_date && coupon.end_date < now) return false;
        if (!coupon.is_active) return false;
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
            return false;
        if (
            coupon.min_order_amount &&
            cartInfo.subtotal < coupon.min_order_amount
        )
            return false;

        if (coupon.applicable_products?.length > 0) {
            if (
                !cartInfo.items.some((i) =>
                    coupon.applicable_products.includes(i.productId),
                )
            )
                return false;
        }
        if (coupon.applicable_categories?.length > 0) {
            if (
                !productList.some((prod) =>
                    prod.categories.some((cat) =>
                        coupon.applicable_categories.includes(cat.id),
                    ),
                )
            )
                return false;
        }
        return true;
    }

    // ===== COUPON VALIDATION & APPLICATION =====
    static async validateCoupon(code, user_id, camelOrderData) {
        if (!code) throw new BadRequestError('Mã giảm giá là bắt buộc');
        const order_data = toSnake(camelOrderData);

        const coupon = await CouponRepo.findActiveByCode(code);
        if (!coupon) throw new NotFoundError('Không tìm thấy mã giảm giá');

        const now = new Date();

        if (coupon.start_date && coupon.start_date > now)
            throw new BadRequestError('Mã giảm giá chưa có hiệu lực');
        if (coupon.end_date && coupon.end_date < now)
            throw new BadRequestError('Mã giảm giá đã hết hạn');
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
            throw new BadRequestError(
                'Mã giảm giá đã được sử dụng quá số lần cho phép',
            );

        // User limitation
        if (user_id) {
            const userCouponUsage = await OrderCouponRepo.count({
                where: {
                    coupon_id: coupon.id,
                },
                include: [
                    {
                        model: database.Order,
                        as: 'order',
                        where: { user_id: user_id },
                    },
                ],
            });
            if (
                coupon.usage_limit_per_user &&
                userCouponUsage >= coupon.usage_limit_per_user
            )
                throw new BadRequestError(
                    'Bạn đã sử dụng mã giảm giá này quá số lần cho phép',
                );

            if (coupon.first_order_only) {
                // Bạn có thể bổ sung repo.countUserOrders(user_id) nếu muốn kiểm tra lần đầu mua
            }
        }

        if (
            coupon.min_order_amount &&
            order_data.subtotal < coupon.min_order_amount
        )
            throw new BadRequestError(
                `Minimum order amount is ${coupon.min_order_amount}`,
            );

        if (order_data.items && order_data.items.length > 0) {
            const validationResult = await this.validateCouponProducts(
                coupon,
                order_data.items,
            );
            if (!validationResult.isValid)
                throw new BadRequestError(validationResult.message);
        }
        return toCamel(coupon.toJSON());
    }

    static async validateCouponProducts(coupon, orderItems) {
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
        const products =
            await ProductRepo.findProductsByIdsWithCategories(productIds);

        if (coupon.excluded_products && coupon.excluded_products.length > 0) {
            if (
                productIds.some((id) => coupon.excluded_products.includes(id))
            ) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá không áp dụng cho sản phẩm bị loại trừ',
                };
            }
        }
        if (
            coupon.excluded_categories &&
            coupon.excluded_categories.length > 0
        ) {
            if (
                products.some((product) =>
                    product.categories.some((category) =>
                        coupon.excluded_categories.includes(category.id),
                    ),
                )
            ) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá không áp dụng cho sản phẩm thuộc danh mục bị loại trừ',
                };
            }
        }
        if (
            coupon.applicable_products &&
            coupon.applicable_products.length > 0
        ) {
            if (
                !productIds.some((id) =>
                    coupon.applicable_products.includes(id),
                )
            ) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá chỉ áp dụng cho một số sản phẩm nhất định',
                };
            }
        }
        if (
            coupon.applicable_categories &&
            coupon.applicable_categories.length > 0
        ) {
            if (
                !products.some((product) =>
                    product.categories.some((category) =>
                        coupon.applicable_categories.includes(category.id),
                    ),
                )
            ) {
                return {
                    isValid: false,
                    message:
                        'Mã giảm giá chỉ áp dụng cho một số danh mục nhất định',
                };
            }
        }
        return { isValid: true };
    }

    static calculateDiscount(coupon, cartInfo) {
        const order_data = toSnake(cartInfo);

        let discountAmount = 0;
        let shippingDiscount = 0;

        if (coupon.type === 'percent') {
            discountAmount = (order_data.subtotal * coupon.value) / 100;
            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(
                    discountAmount,
                    parseInt(coupon.maxDiscountAmount),
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

    static async applyCouponToOrder(
        orderId,
        couponId,
        camelDiscountData,
        transaction,
    ) {
        const { error, value: discountData } =
            discountDataSchema.validate(camelDiscountData);
        if (error) throw new BadRequestError(error.message);

        const discountValue = Number(discountData.discountValue);
        const discountAmount = Number(discountData.discountAmount);
        const orderSubtotal = Number(discountData.orderSubtotal);
        const shippingFee = Number(discountData.shippingFee);
        const shippingDiscount = Number(discountData.shippingDiscount);

        let rawConditionsMet = discountData.conditionsMet || {};
        const conditionsMet = {
            minOrderAmount:
                rawConditionsMet.minOrderAmount !== undefined &&
                rawConditionsMet.minOrderAmount !== null
                    ? Number(rawConditionsMet.minOrderAmount)
                    : 0,
            applicableProducts: Array.isArray(
                rawConditionsMet.applicableProducts,
            )
                ? rawConditionsMet.applicableProducts
                : [],
            applicableCategories: Array.isArray(
                rawConditionsMet.applicableCategories,
            )
                ? rawConditionsMet.applicableCategories
                : [],
        };

        const orderCoupon = await OrderCouponRepo.create(
            {
                order_id: orderId,
                coupon_id: couponId,
                coupon_code: discountData.couponCode,
                discount_type: discountData.discountType,
                discount_value: discountValue,
                discount_amount: discountAmount,
                order_subtotal: orderSubtotal,
                shipping_fee: shippingFee,
                shipping_discount: shippingDiscount,
                applied_products: discountData.appliedProducts || [],
                conditions_met: conditionsMet,
            },
            transaction,
        );

        await CouponRepo.incrementUsedCount(couponId, transaction);

        return orderCoupon;
    }
}

module.exports = CouponService;
