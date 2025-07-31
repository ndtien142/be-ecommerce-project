'use strict';

const express = require('express');
const router = express.Router();

const { authenticationV2 } = require('../../auth/authUtils');
const checkRole = require('../../middleware/checkRole');
const couponController = require('../../controllers/coupon.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *         - value
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của coupon
 *         code:
 *           type: string
 *           description: "Mã coupon (VD: WELCOME50)"
 *         name:
 *           type: string
 *           description: Tên coupon
 *         description:
 *           type: string
 *           description: Mô tả coupon
 *         type:
 *           type: string
 *           enum: [percent, fixed, free_shipping]
 *           description: Loại giảm giá
 *         value:
 *           type: number
 *           description: Giá trị giảm (% hoặc VND)
 *         minOrderAmount:
 *           type: number
 *           description: Giá trị đơn hàng tối thiểu
 *         maxDiscountAmount:
 *           type: number
 *           description: Số tiền giảm tối đa
 *         usageLimit:
 *           type: integer
 *           description: Số lần sử dụng tối đa
 *         usageLimitPerUser:
 *           type: integer
 *           description: Số lần mỗi user có thể sử dụng
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Ngày bắt đầu
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Ngày kết thúc
 *         isActive:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         firstOrderOnly:
 *           type: boolean
 *           description: Chỉ áp dụng cho đơn hàng đầu tiên
 *
 *     CouponValidation:
 *       type: object
 *       required:
 *         - code
 *         - subtotal
 *       properties:
 *         code:
 *           type: string
 *           description: Mã coupon cần validate
 *         subtotal:
 *           type: number
 *           description: Tổng tiền sản phẩm
 *         shippingFee:
 *           type: number
 *           description: Phí vận chuyển
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 */

/**
 * @swagger
 * /coupons/available:
 *   post:
 *     summary: Lấy danh sách coupon hợp lệ cho giỏ hàng hiện tại
 *     tags: [Coupons]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - subtotal
 *               - items
 *             properties:
 *               userId:
 *                 type: integer
 *               subtotal:
 *                 type: number
 *               shippingFee:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Lấy các coupon hợp lệ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 */

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate mã coupon
 *     tags: [Coupons]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CouponValidation'
 *     responses:
 *       200:
 *         description: Coupon hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *                     discount:
 *                       type: object
 *                       properties:
 *                         discountAmount:
 *                           type: number
 *                         shippingDiscount:
 *                           type: number
 *       400:
 *         description: Coupon không hợp lệ
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Tạo mã coupon mới
 *     tags: [Coupons - Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coupon'
 *     responses:
 *       201:
 *         description: Tạo coupon thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *   get:
 *     summary: Lấy danh sách coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percent, fixed, free_shipping]
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách coupon thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: Lấy chi tiết coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy coupon thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *   put:
 *     summary: Cập nhật coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coupon'
 *     responses:
 *       200:
 *         description: Cập nhật coupon thành công
 *   delete:
 *     summary: Xóa coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa coupon thành công
 */

/**
 * @swagger
 * /coupons/{id}/toggle-status:
 *   patch:
 *     summary: Kích hoạt/vô hiệu hóa coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái coupon thành công
 */
router.use(authenticationV2);

// ===== PUBLIC ROUTE: Lấy các coupon hợp lệ cho giỏ hàng =====
router.get('/available', couponController.getValidCouponsForCart);

// ===== AUTH ROUTES =====

router.post('/validate', couponController.validateCoupon);

// ===== ADMIN ROUTES =====
router.use(checkRole(['admin']));

router
    .route('/')
    .post(couponController.createCoupon)
    .get(couponController.getCoupons);

router
    .route('/:id')
    .get(couponController.getCouponById)
    .put(couponController.updateCoupon)
    .delete(couponController.deleteCoupon);

router.patch('/:id/toggle-status', couponController.toggleCouponStatus);

module.exports = router;
