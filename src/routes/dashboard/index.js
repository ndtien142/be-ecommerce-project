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
 * /api/v1/dashboard/workflow/statistics:
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
 *           enum: ['today', '7days', 'month', 'custom']
 *           default: '7days'
 *         description: Time period for statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD) - required when period=custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD) - required when period=custom
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: 'Asia/Ho_Chi_Minh'
 *         description: Timezone for date calculations
 *     responses:
 *       200:
 *         description: Workflow statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy thống kê workflow thành công"
 *                 status:
 *                   type: number
 *                   example: 200
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "7days"
 *                         startDate:
 *                           type: string
 *                           example: "2025-07-08"
 *                         endDate:
 *                           type: string
 *                           example: "2025-07-14"
 *                         timezone:
 *                           type: string
 *                           example: "Asia/Ho_Chi_Minh"
 *                     ordersByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             example: "pending_confirmation"
 *                           displayName:
 *                             type: string
 *                             example: "Chờ xác nhận"
 *                           count:
 *                             type: number
 *                             example: 25
 *                           percentage:
 *                             type: number
 *                             example: 35.2
 *                           color:
 *                             type: string
 *                             example: "#ff9800"
 *                     paymentsByStatusAndMethod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           method:
 *                             type: string
 *                             example: "momo"
 *                           displayName:
 *                             type: string
 *                             example: "MoMo"
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                           count:
 *                             type: number
 *                             example: 45
 *                           totalAmount:
 *                             type: number
 *                             example: 15000000
 *                           percentage:
 *                             type: number
 *                             example: 65.2
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Giá trị period phải là: today, 7days, month, hoặc custom"
 *                 status:
 *                   type: number
 *                   example: 400
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
    '/workflow/statistics',
    checkRole(['admin']),
    DashboardController.getWorkflowStatistics,
);

/**
 * @swagger
 * /api/v1/dashboard/workflow/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['today', '7days', 'month', 'custom']
 *           default: '7days'
 *         description: Time period for statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD) - required when period=custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD) - required when period=custom
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: 'Asia/Ho_Chi_Minh'
 *         description: Timezone for date calculations
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy thống kê dashboard thành công"
 *                 status:
 *                   type: number
 *                   example: 200
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                     totalOrders:
 *                       type: number
 *                       example: 156
 *                     totalActions:
 *                       type: number
 *                       example: 423
 *                     completionRate:
 *                       type: number
 *                       example: 87.5
 *                     averageProcessingTime:
 *                       type: number
 *                       example: 45
 *                       description: Average processing time in minutes
 *                     trends:
 *                       type: object
 *                       properties:
 *                         ordersGrowth:
 *                           type: number
 *                           example: 12.5
 *                           description: Percentage growth compared to previous period
 *                         actionsGrowth:
 *                           type: number
 *                           example: 8.3
 *                         completionRateChange:
 *                           type: number
 *                           example: 0.0
 *                         processingTimeChange:
 *                           type: number
 *                           example: -5.2
 *                     pendingAlerts:
 *                       type: object
 *                       properties:
 *                         pendingConfirmation:
 *                           type: number
 *                           example: 12
 *                         pendingPickup:
 *                           type: number
 *                           example: 8
 *                         overdueOrders:
 *                           type: number
 *                           example: 3
 *                         paymentIssues:
 *                           type: number
 *                           example: 2
 *                     actionStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                             example: "payment_completed"
 *                           displayName:
 *                             type: string
 *                             example: "Thanh toán hoàn tất"
 *                           count:
 *                             type: number
 *                             example: 145
 *                           percentage:
 *                             type: number
 *                             example: 34.3
 *                           trend:
 *                             type: string
 *                             enum: ['up', 'down', 'stable']
 *                             example: "up"
 *                           trendValue:
 *                             type: number
 *                             example: 12.5
 *                     actorStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           actorType:
 *                             type: string
 *                             example: "admin"
 *                           displayName:
 *                             type: string
 *                             example: "Quản trị viên"
 *                           count:
 *                             type: number
 *                             example: 189
 *                           percentage:
 *                             type: number
 *                             example: 44.7
 *                           averageResponseTime:
 *                             type: number
 *                             example: 15
 *                             description: Average response time in minutes
 *                           activeCount:
 *                             type: number
 *                             nullable: true
 *                             example: 5
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
    '/workflow/overview',
    checkRole(['admin']),
    DashboardController.getDashboardOverview,
);

/**
 * @swagger
 * /api/v1/dashboard/workflow/timeseries:
 *   get:
 *     summary: Get time series data for charts
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['today', '7days', 'month', 'custom']
 *           default: '7days'
 *         description: Time period for data
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD) - required when period=custom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD) - required when period=custom
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: ['hour', 'day', 'week']
 *           default: 'day'
 *         description: Time granularity for data points
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *           default: 'orders,revenue,actions'
 *         description: Comma-separated list of metrics to include
 *     responses:
 *       200:
 *         description: Time series data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy dữ liệu thời gian thành công"
 *                 status:
 *                   type: number
 *                   example: 200
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "7days"
 *                         startDate:
 *                           type: string
 *                           example: "2025-07-08"
 *                         endDate:
 *                           type: string
 *                           example: "2025-07-14"
 *                         granularity:
 *                           type: string
 *                           example: "day"
 *                     timeSeries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2025-07-08"
 *                           orders:
 *                             type: number
 *                             example: 18
 *                           revenue:
 *                             type: number
 *                             example: 2450000
 *                           actions:
 *                             type: number
 *                             example: 52
 *                           completionRate:
 *                             type: number
 *                             example: 85.2
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
    '/workflow/timeseries',

    checkRole(['admin']),
    DashboardController.getTimeSeriesData,
);

/**
 * @swagger
 * /api/v1/dashboard/workflow/realtime:
 *   get:
 *     summary: Get real-time metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: Real-time metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy thống kê thời gian thực thành công"
 *                 status:
 *                   type: number
 *                   example: 200
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-14T10:30:00Z"
 *                     activeOrders:
 *                       type: number
 *                       example: 45
 *                     activeShippers:
 *                       type: number
 *                       example: 12
 *                     pendingActions:
 *                       type: number
 *                       example: 8
 *                     systemHealth:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           example: 156
 *                           description: Response time in milliseconds
 *                         uptime:
 *                           type: number
 *                           example: 99.98
 *                           description: Uptime percentage
 *                     recentActivities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                             example: 1
 *                           orderId:
 *                             type: number
 *                             example: 62
 *                           action:
 *                             type: string
 *                             example: "delivered"
 *                           actorType:
 *                             type: string
 *                             example: "shipper"
 *                           actorName:
 *                             type: string
 *                             example: "Hùng"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-07-14T10:25:00Z"
 *                           description:
 *                             type: string
 *                             example: "Đã giao hàng thành công"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
    '/workflow/realtime',
    checkRole(['admin']),
    DashboardController.getRealtimeMetrics,
);

/**
 * @swagger
 * /api/v1/dashboard/workflow/cache:
 *   delete:
 *     summary: Clear dashboard cache
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdHeader'
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Xóa cache thành công"
 *                 status:
 *                   type: number
 *                   example: 200
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete(
    '/workflow/cache',
    checkRole(['admin']),
    DashboardController.clearCache,
);

module.exports = router;
