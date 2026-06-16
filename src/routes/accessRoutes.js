import express from "express";
import * as accessController from "../controller/accessController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CREATE ACCESS
===================================================== */

/**
 * @swagger
 * /api/access:
 *   post:
 *     summary: Create access mapping
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - app_type
 *               - role
 *             properties:
 *               app_type:
 *                 type: string
 *                 enum: [field, agent, admin]
 *                 example: field
 *               role:
 *                 type: string
 *                 example: field executive
 *     responses:
 *       201:
 *         description: Access created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/access", accessController.addAccess);

/* =====================================================
   GET ALL ACCESS
===================================================== */

/**
 * @swagger
 * /api/access:
 *   get:
 *     summary: Get all access mappings
 *     tags: [Access]
 *     responses:
 *       200:
 *         description: Access list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       app_type:
 *                         type: string
 *                         example: field
 *                       role:
 *                         type: string
 *                         example: field executive
 *       500:
 *         description: Internal server error
 */
router.get("/access", accessController.listAccess);

/* =====================================================
   CHECK ACCESS
===================================================== */

/**
 * @swagger
 * /api/access/check/{appType}:
 *   get:
 *     summary: Check whether logged-in user has access to an app type
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [field, agent, admin]
 *         example: field
 *     responses:
 *       200:
 *         description: Access validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hasAccess:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *     description: |
 *       Role is automatically extracted from the JWT token.
 *
 *       Example:
 *       - Token role = "field executive"
 *       - appType = "field"
 *
 *       The API checks whether a record exists:
 *
 *       {
 *         "role": "field executive",
 *         "app_type": "field"
 *       }
 *
 *       Returns:
 *       {
 *         "success": true,
 *         "hasAccess": true
 *       }
 */
router.get("/access/check/:appType", verifyToken, accessController.validateAccess);

export default router;