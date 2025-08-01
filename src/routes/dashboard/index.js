const express = require('express');
const router = express.Router();
const DashboardController = require('../../controllers/dashboard.controller');
const { authenticationV2 } = require('../../auth/authUtils');
const checkRole = require('../../middleware/checkRole');

router.use(authenticationV2);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard workflow statistics APIs
 */

/**
 * @swagger
 * /dashboard/workflow/statistics:
 *   get:
 *     summary: Get workflow statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7days, week, month, quarter, year, custom]
 *           default: 7days
 *         description: Thời gian thống kê
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD) - bắt buộc với period=custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD) - bắt buộc với period=custom
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: Asia/Ho_Chi_Minh
 *         description: Múi giờ
 *     responses:
 *       200:
 *         description: Lấy thống kê workflow thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: number
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Tham số không hợp lệ
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 */
router.get(
    '/workflow/statistics',
    checkRole(['admin']),
    DashboardController.getWorkflowStatistics,
);

/**
 * @swagger
 * /dashboard/workflow/overview:
 *   get:
 *     summary: Lấy tổng quan dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7days, week, month, quarter, year, custom]
 *           default: 7days
 *         description: Thời gian thống kê
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD) - bắt buộc với period=custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD) - bắt buộc với period=custom
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: Asia/Ho_Chi_Minh
 *         description: Múi giờ
 *     responses:
 *       200:
 *         description: Lấy tổng quan dashboard thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: number
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Tham số không hợp lệ
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 */
router.get(
    '/workflow/overview',
    checkRole(['admin']),
    DashboardController.getDashboardOverview,
);

/**
 * @swagger
 * /dashboard/workflow/timeseries:
 *   get:
 *     summary: Lấy dữ liệu chuỗi thời gian cho biểu đồ dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7days, week, month, quarter, year, custom]
 *           default: 7days
 *         description: Thời gian thống kê
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD) - bắt buộc với period=custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD) - bắt buộc với period=custom
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, quarter, year]
 *           default: day
 *         description: Độ phân giải thời gian cho dữ liệu
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *           default: orders,revenue,actions
 *         description: Danh sách metrics, phân cách bởi dấu phẩy
 *     responses:
 *       200:
 *         description: Lấy dữ liệu chuỗi thời gian thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: number
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Tham số không hợp lệ
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 */
router.get(
    '/workflow/timeseries',
    checkRole(['admin']),
    DashboardController.getTimeSeriesData,
);

/**
 * @swagger
 * /dashboard/workflow/realtime:
 *   get:
 *     summary: Lấy thống kê realtime dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: Lấy thống kê realtime thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: number
 *                 metadata:
 *                   type: object
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 */
router.get(
    '/workflow/realtime',
    checkRole(['admin']),
    DashboardController.getRealtimeMetrics,
);

/**
 * @swagger
 * /dashboard/recent-orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng mới nhất
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng cần lấy
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 */
router.get(
    '/recent-orders',
    checkRole(['admin']),
    DashboardController.getRecentOrders,
);

/**
 * @swagger
 * /dashboard/workflow/cache:
 *   delete:
 *     summary: Xóa cache dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: Xóa cache thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: number
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 */
router.delete(
    '/workflow/cache',
    checkRole(['admin']),
    DashboardController.clearCache,
);

module.exports = router;
