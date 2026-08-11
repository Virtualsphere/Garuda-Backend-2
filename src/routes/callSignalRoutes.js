import express from "express";
import * as callSignalController from "../controller/callSignalController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CREATE CALL SIGNAL (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/call-signal:
 *   post:
 *     summary: Log a new call signal (JWT required)
 *     tags: [CallSignal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [department_type]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               department_type:
 *                 type: string
 *                 example: "farmers"
 *               direction:
 *                 type: string
 *                 enum: [inbound, outbound]
 *               caller_name:
 *                 type: string
 *               caller_phone:
 *                 type: string
 *               caller_type:
 *                 type: string
 *               mission_context:
 *                 type: string
 *               land_id:
 *                 type: integer
 *               duration_seconds:
 *                 type: integer
 *               missed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Call signal created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/call-signal", verifyToken, callSignalController.createCallSignal);

/* =====================================================
   GET ALL CALL SIGNALS (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/call-signal:
 *   get:
 *     summary: Get call signals, optionally filtered (JWT required)
 *     tags: [CallSignal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [inbound, outbound]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call signals fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/call-signal", verifyToken, callSignalController.getAllCallSignals);

/* =====================================================
   GET CALL SIGNAL METRICS (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/call-signal/metrics:
 *   get:
 *     summary: Get aggregated call metrics (JWT required)
 *     tags: [CallSignal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/call-signal/metrics", verifyToken, callSignalController.getCallSignalMetrics);

/* =====================================================
   UPDATE CALL SIGNAL STATUS (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/call-signal/{id}/status:
 *   put:
 *     summary: Update a call signal's status (JWT required)
 *     tags: [CallSignal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 example: "attended"
 *     responses:
 *       200:
 *         description: Call signal status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Call signal not found
 */
router.put("/call-signal/:id/status", verifyToken, callSignalController.updateCallSignalStatus);

export default router;
