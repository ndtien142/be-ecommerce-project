'use strict';

const { OK, CREATED } = require('../utils/httpStatusCode');
const { SuccessResponse } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const { asyncHandler } = require('../helpers/asyncHandler');
const CouponService = require('../services/promotion/coupon.service');
const { toCamel } = require('../utils/common.utils');

class CouponController {
    // ===== ADMIN COUPON MANAGEMENT =====

    /** Tạo mã giảm giá mới */
    createCoupon = asyncHandler(async (req, res) => {
        const coupon = await CouponService.createCoupon({
            ...req.body,
            createdBy: req.user.userId,
        });
        new SuccessResponse({
            message: 'Tạo mã giảm giá thành công',
            metadata: { coupon },
        }).send(res);
    });

    /** Lấy danh sách coupon */
    getCoupons = asyncHandler(async (req, res) => {
        const result = await CouponService.getCoupons(req.query);
        new SuccessResponse({
            message: 'Lấy danh sách mã giảm giá thành công',
            metadata: result,
        }).send(res);
    });

    /** Lấy chi tiết coupon */
    getCouponById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const coupon = await CouponService.getCouponById(id);
        new SuccessResponse({
            message: 'Lấy chi tiết mã giảm giá thành công',
            metadata: { coupon },
        }).send(res);
    });

    /** Cập nhật coupon */
    updateCoupon = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const coupon = await CouponService.updateCoupon({ id, ...req.body });
        new SuccessResponse({
            message: 'Cập nhật mã giảm giá thành công',
            metadata: { coupon },
        }).send(res);
    });

    /** Kích hoạt / vô hiệu hóa coupon */
    toggleCouponStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { isActive } = req.body;
        const coupon = await CouponService.toggleCouponStatus(id, isActive);
        new SuccessResponse({
            message: 'Cập nhật trạng thái mã giảm giá thành công',
            metadata: { coupon },
        }).send(res);
    });

    /** Xóa coupon */
    deleteCoupon = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await CouponService.deleteCoupon(id);
        new SuccessResponse({
            message: 'Xóa mã giảm giá thành công',
            metadata: result,
        }).send(res);
    });

    // ===== GET COUPONS VALID FOR CART =====

    /**
     * Lấy danh sách coupon hợp lệ cho giỏ hàng hiện tại
     * Body: { userId, subtotal, items: [{productId, quantity}], shippingFee }
     */
    getValidCouponsForCart = asyncHandler(async (req, res) => {
        const coupons = await CouponService.getValidCouponsForCart({
            userId: req.user.userId,
        });
        new SuccessResponse({
            message: 'Lấy danh sách mã giảm giá hợp lệ cho giỏ hàng thành công',
            metadata: { items: coupons },
        }).send(res);
    });

    // ===== COUPON VALIDATION =====

    /**
     * Validate coupon
     * Body: { code, subtotal, shipping_fee, items }
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
            req.user?.userId,
            order_data,
        );
        const discount = CouponService.calculateDiscount(coupon, order_data);

        new SuccessResponse({
            message: 'Mã giảm giá hợp lệ',
            metadata: {
                coupon: toCamel(coupon),
                discount,
            },
        }).send(res);
    });
}

module.exports = new CouponController();
