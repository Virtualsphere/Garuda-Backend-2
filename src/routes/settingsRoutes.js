import express from "express";
import * as settingsController from "../controller/settingsController.js";
import verifyToken from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* =====================================================
   GET ALL SETTINGS
===================================================== */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all settings (JWT required)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/settings", verifyToken, settingsController.getAllSettings);

/* =====================================================
   GET SETTING BY KEY
===================================================== */

/**
 * @swagger
 * /api/settings/{key}:
 *   get:
 *     summary: Get a setting by key (JWT required)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "enquiry_fee"
 *     responses:
 *       200:
 *         description: Setting fetched successfully (data is null if not yet set)
 *       401:
 *         description: Unauthorized
 */
router.get("/settings/:key", verifyToken, settingsController.getSettingByKey);

/* =====================================================
   UPSERT SETTING (ADMIN ONLY)
===================================================== */

/**
 * @swagger
 * /api/settings/{key}:
 *   put:
 *     summary: Create or update a setting (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "enquiry_fee"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 description: Any JSON-serializable value
 *     responses:
 *       200:
 *         description: Setting saved successfully
 *       400:
 *         description: Setting value is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put("/settings/:key", verifyToken, requireAdmin, settingsController.upsertSetting);

export default router;
