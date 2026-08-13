import express from "express";
import * as callingController from "../controller/callingController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/calling/click-to-call:
 *   post:
 *     summary: Initiate a peer-to-peer call via MyOperator (JWT required)
 *     tags: [Calling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerNumber, departmentType]
 *             properties:
 *               customerNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               departmentType:
 *                 type: string
 *                 example: "farmers"
 *               callerName:
 *                 type: string
 *               missionContext:
 *                 type: string
 *               landId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Call initiated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       502:
 *         description: MyOperator request failed
 */
router.post("/calling/click-to-call", verifyToken, callingController.clickToCall);

export default router;
