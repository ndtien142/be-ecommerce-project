'use strict';

const express = require('express');
const router = express.Router();
const JobController = require('../../controllers/job.controller');

/**
 * @swagger
 * /job/status:
 *   get:
 *     summary: Get job status
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
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
 *                     userCleanup:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: boolean
 *                         cronExpression:
 *                           type: string
 *                         timezone:
 *                           type: string
 */
router.get('/status', JobController.getJobStatus);

/**
 * @swagger
 * /job/cleanup/users:
 *   post:
 *     summary: Manually trigger user cleanup job
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: User cleanup job triggered successfully
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
 *                     success:
 *                       type: boolean
 */
router.post('/cleanup/users', JobController.manualUserCleanup);

module.exports = router;
