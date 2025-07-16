'use strict';

const { OK, CREATED } = require('../utils/httpStatusCode');
const {
    SuccessResponse,
    CreatedResponse,
} = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const { asyncHandler } = require('../helpers/asyncHandler');
const CouponService = require('../services/promotion/coupon.service');

class CouponController {
    // ===== ADMIN COUPON MANAGEMENT =====

    /**
     * Tạo mã giảm giá mới
     */
    createCoupon = asyncHandler(async (req, res) => {
        const coupon = await CouponService.createCoupon({
            ...req.body,
            created_by: req.user.userId,
        });

        new CreatedResponse({
            message: 'Coupon created successfully',
            metadata: { coupon },
        }).send(res);
    });

    /**
     * Lấy danh sách coupon
     */
    getCoupons = asyncHandler(async (req, res) => {
        const result = await CouponService.getCoupons(req.query);

        new SuccessResponse({
            message: 'Get coupons successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Lấy chi tiết coupon
     */
    getCouponById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const coupon = await CouponService.getCouponById(id);

        new SuccessResponse({
            message: 'Get coupon successfully',
            metadata: { coupon },
        }).send(res);
    });

    /**
     * Cập nhật coupon
     */
    updateCoupon = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const coupon = await CouponService.updateCoupon(id, req.body);

        new SuccessResponse({
            message: 'Coupon updated successfully',
            metadata: { coupon },
        }).send(res);
    });

    /**
     * Xóa coupon
     */
    deleteCoupon = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await CouponService.deleteCoupon(id);

        new SuccessResponse({
            message: 'Coupon deleted successfully',
            metadata: result,
        }).send(res);
    });

    // ===== USER COUPON MANAGEMENT =====

    /**
     * Tặng coupon cho user
     */
    grantCouponToUser = asyncHandler(async (req, res) => {
        const userCoupon = await CouponService.grantCouponToUser(req.body);

        new CreatedResponse({
            message: 'Coupon granted to user successfully',
            metadata: { user_coupon: userCoupon },
        }).send(res);
    });

    /**
     * Lấy danh sách coupon của user
     */
    getUserCoupons = asyncHandler(async (req, res) => {
        const { user_id } = req.params;

        if (!user_id) {
            throw new BadRequestError('user_id parameter is required');
        }

        const result = await CouponService.getUserCoupons(user_id, req.query);

        new SuccessResponse({
            message: 'Get user coupons successfully',
            metadata: result,
        }).send(res);
    });

    /**
     * Lấy danh sách coupon của user hiện tại
     */
    getMyAvailableCoupons = asyncHandler(async (req, res) => {
        if (!req.user || !req.user.userId) {
            throw new BadRequestError('User authentication required');
        }

        const result = await CouponService.getUserCoupons(req.user.userId, {
            ...req.query,
            is_available_only: true,
        });

        new SuccessResponse({
            message: 'Get my available coupons successfully',
            metadata: result,
        }).send(res);
    });

    // ===== COUPON VALIDATION =====

    /**
     * Validate coupon
     */
    validateCoupon = asyncHandler(async (req, res) => {
        const { code } = req.body;
        const order_data = {
            subtotal: req.body.subtotal,
            shipping_fee: req.body.shipping_fee,
            items: req.body.items,
        };

        const coupon = await CouponService.validateCoupon(
            code,
            req.user.userId,
            order_data,
        );
        const discount = CouponService.calculateDiscount(coupon, order_data);

        new SuccessResponse({
            message: 'Coupon is valid',
            metadata: {
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    name: coupon.name,
                    type: coupon.type,
                    value: coupon.value,
                },
                discount,
            },
        }).send(res);
    });

    /**
     * Lấy danh sách coupon available cho user (public)
     */
    getAvailableCoupons = asyncHandler(async (req, res) => {
        const now = new Date();
        const result = await CouponService.getCoupons({
            ...req.query,
            is_active: true,
            start_date: now,
            end_date: now,
        });

        // Filter out coupons that user has already used maximum times
        let availableCoupons = result.coupons;

        if (req.user) {
            // TODO: Filter based on user usage
            availableCoupons = result.coupons.filter((coupon) => {
                // This would require additional logic to check user usage
                return true;
            });
        }

        new SuccessResponse({
            message: 'Get available coupons successfully',
            metadata: {
                ...result,
                coupons: availableCoupons,
            },
        }).send(res);
    });
}

module.exports = new CouponController();
