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
 *         min_order_amount:
 *           type: number
 *           description: Giá trị đơn hàng tối thiểu
 *         max_discount_amount:
 *           type: number
 *           description: Số tiền giảm tối đa
 *         usage_limit:
 *           type: integer
 *           description: Số lần sử dụng tối đa
 *         usage_limit_per_user:
 *           type: integer
 *           description: Số lần mỗi user có thể sử dụng
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Ngày bắt đầu
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: Ngày kết thúc
 *         is_active:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         first_order_only:
 *           type: boolean
 *           description: Chỉ áp dụng cho đơn hàng đầu tiên
 *
 *     UserCoupon:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         coupon_id:
 *           type: integer
 *         personal_code:
 *           type: string
 *           description: Mã cá nhân hóa
 *         gift_message:
 *           type: string
 *           description: Lời nhắn tặng
 *         used_count:
 *           type: integer
 *           description: Số lần đã sử dụng
 *         max_usage:
 *           type: integer
 *           description: Số lần tối đa có thể sử dụng
 *         valid_from:
 *           type: string
 *           format: date-time
 *         valid_until:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 *         source:
 *           type: string
 *           enum: [system_reward, admin_gift, event_reward, referral_bonus, loyalty_point]
 *           description: Nguồn gốc voucher
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
 *         shipping_fee:
 *           type: number
 *           description: Phí vận chuyển
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 */

/**
 * @swagger
 * /api/v1/coupons/available:
 *   get:
 *     summary: Lấy danh sách coupon có sẵn
 *     tags: [Coupons]
 *     parameters:
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percent, fixed, free_shipping]
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
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *                     pagination:
 *                       type: object
 */

/**
 * @swagger
 * /api/v1/coupons/validate:
 *   post:
 *     summary: Validate mã coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *                         discount_amount:
 *                           type: number
 *                         shipping_discount:
 *                           type: number
 *       400:
 *         description: Coupon không hợp lệ
 */

/**
 * @swagger
 * /api/v1/coupons/my-available:
 *   get:
 *     summary: Lấy danh sách coupon có sẵn của tôi
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *                     user_coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserCoupon'
 *                     pagination:
 *                       type: object
 */

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     summary: Tạo mã coupon mới
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *         name: is_active
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
 */

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   get:
 *     summary: Lấy chi tiết coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 *       - $ref: '#/components/parameters/UserIdHeader'
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
 * /api/v1/coupons/grant-user:
 *   post:
 *     summary: Tặng coupon cho user
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - coupon_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               coupon_id:
 *                 type: integer
 *               personal_code:
 *                 type: string
 *               gift_message:
 *                 type: string
 *               max_usage:
 *                 type: integer
 *                 default: 1
 *               valid_from:
 *                 type: string
 *                 format: date-time
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *               source:
 *                 type: string
 *                 enum: [system_reward, admin_gift, event_reward, referral_bonus, loyalty_point]
 *     responses:
 *       201:
 *         description: Tặng coupon thành công
 */

/**
 * @swagger
 * /api/v1/coupons/user/{user_id}:
 *   get:
 *     summary: Lấy danh sách coupon của user
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
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
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: is_available_only
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lấy danh sách coupon của user thành công
 */

// ===== PUBLIC ROUTES =====

router.get('/available', couponController.getAvailableCoupons);

router.use(authenticationV2);

// ===== AUTHENTICATED ROUTES =====

router.post('/validate', couponController.validateCoupon);
router.get('/my-available', couponController.getMyAvailableCoupons);
router.get('/available-system', couponController.getAvailableSystemCoupon);
router.get('/user/:user_id', couponController.getUserCoupons);

// ===== ADMIN ROUTES =====
router.use(checkRole(['admin']));

router
    .route('/')
    .post(couponController.createCoupon)
    .get(couponController.getCoupons);

router.patch('/:id/toggle-status', couponController.toggleCouponStatus);

router.post('/grant-user', couponController.grantCouponToUser);

router
    .route('/:id')
    .get(couponController.getCouponById)
    .put(couponController.updateCoupon)
    .delete(couponController.deleteCoupon);

module.exports = router;
