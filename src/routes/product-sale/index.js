'use strict';

const express = require('express');
const router = express.Router();

const { authentication } = require('../../auth/authUtils');
const checkRole = require('../../middleware/checkRole');
const productSaleController = require('../../controllers/productSale.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductSale:
 *       type: object
 *       required:
 *         - product_id
 *         - name
 *         - discount_type
 *         - discount_value
 *         - start_date
 *         - end_date
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của product sale
 *         product_id:
 *           type: integer
 *           description: ID sản phẩm
 *         name:
 *           type: string
 *           description: Tên đợt sale
 *         description:
 *           type: string
 *           description: Mô tả đợt sale
 *         discount_type:
 *           type: string
 *           enum: [percent, fixed]
 *           description: Loại giảm giá
 *         discount_value:
 *           type: number
 *           description: Giá trị giảm (% hoặc VND)
 *         original_price:
 *           type: number
 *           description: Giá gốc
 *         sale_price:
 *           type: number
 *           description: Giá sale
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Ngày bắt đầu sale
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: Ngày kết thúc sale
 *         is_active:
 *           type: boolean
 *           description: Trạng thái hoạt động
 *         quantity_limit:
 *           type: integer
 *           description: Số lượng sale tối đa
 *         sold_quantity:
 *           type: integer
 *           description: Số lượng đã bán
 *         min_quantity:
 *           type: integer
 *           description: Số lượng tối thiểu để áp dụng
 *         max_quantity_per_user:
 *           type: integer
 *           description: Số lượng tối đa mỗi user
 *         campaign_id:
 *           type: string
 *           description: ID chiến dịch
 *         priority:
 *           type: integer
 *           description: Độ ưu tiên
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags của sale
 *
 *     BulkSaleRequest:
 *       type: object
 *       required:
 *         - product_ids
 *         - name
 *         - discount_type
 *         - discount_value
 *         - start_date
 *         - end_date
 *       properties:
 *         product_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: Danh sách ID sản phẩm
 *         campaign_id:
 *           type: string
 *           description: ID chiến dịch
 *         name:
 *           type: string
 *           description: Tên đợt sale
 *         description:
 *           type: string
 *           description: Mô tả đợt sale
 *         discount_type:
 *           type: string
 *           enum: [percent, fixed]
 *           description: Loại giảm giá
 *         discount_value:
 *           type: number
 *           description: Giá trị giảm
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *         quantity_limit:
 *           type: integer
 *         min_quantity:
 *           type: integer
 *           default: 1
 *         max_quantity_per_user:
 *           type: integer
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         priority:
 *           type: integer
 *           default: 1
 */

// ===== PUBLIC ROUTES =====

/**
 * @swagger
 * /api/v1/product-sales/on-sale:
 *   get:
 *     summary: Lấy danh sách sản phẩm đang sale
 *     tags: [Product Sales]
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
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: campaign_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_discount
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_discount
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm sale thành công
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
 *                     products_on_sale:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductSale'
 *                     pagination:
 *                       type: object
 */
router.get('/on-sale', productSaleController.getProductsOnSale);

/**
 * @swagger
 * /api/v1/product-sales/product/{product_id}/active:
 *   get:
 *     summary: Lấy sale đang hoạt động của sản phẩm
 *     tags: [Product Sales]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy sale sản phẩm thành công
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
 *                     product_sale:
 *                       $ref: '#/components/schemas/ProductSale'
 */
router.get(
    '/product/:product_id/active',
    productSaleController.getActiveProductSale,
);

// ===== ADMIN ROUTES =====
router.use(authentication);
router.use(checkRole(['admin', 'manager']));

/**
 * @swagger
 * /api/v1/product-sales:
 *   post:
 *     summary: Tạo đợt sale cho sản phẩm
 *     tags: [Product Sales - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductSale'
 *     responses:
 *       201:
 *         description: Tạo sale thành công
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
 *                     product_sale:
 *                       $ref: '#/components/schemas/ProductSale'
 *   get:
 *     summary: Lấy danh sách product sales
 *     tags: [Product Sales - Admin]
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
 *         name: product_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: campaign_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách sale thành công
 */
router
    .route('/')
    .post(productSaleController.createProductSale)
    .get(productSaleController.getProductSales);

/**
 * @swagger
 * /api/v1/product-sales/{id}:
 *   put:
 *     summary: Cập nhật product sale
 *     tags: [Product Sales - Admin]
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
 *             $ref: '#/components/schemas/ProductSale'
 *     responses:
 *       200:
 *         description: Cập nhật sale thành công
 *   delete:
 *     summary: Xóa product sale
 *     tags: [Product Sales - Admin]
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
 *         description: Xóa sale thành công
 */
router
    .route('/:id')
    .put(productSaleController.updateProductSale)
    .delete(productSaleController.deleteProductSale);

/**
 * @swagger
 * /api/v1/product-sales/bulk:
 *   post:
 *     summary: Tạo bulk sales cho campaign
 *     tags: [Product Sales - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkSaleRequest'
 *     responses:
 *       201:
 *         description: Tạo bulk sale thành công
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
 *                     product_sales:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductSale'
 *                     count:
 *                       type: integer
 */
router.post('/bulk', productSaleController.createBulkSales);

/**
 * @swagger
 * /api/v1/product-sales/statistics:
 *   get:
 *     summary: Lấy thống kê sales
 *     tags: [Product Sales - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: campaign_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_sales:
 *                           type: integer
 *                         active_sales:
 *                           type: integer
 *                         total_sold_quantity:
 *                           type: integer
 *                         avg_discount_value:
 *                           type: number
 */
router.get('/statistics', productSaleController.getSaleStatistics);

module.exports = router;
