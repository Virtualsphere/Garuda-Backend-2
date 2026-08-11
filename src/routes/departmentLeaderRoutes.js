import express from "express";
import * as departmentLeaderController from "../controller/departmentLeaderController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   SET ALLOTMENT (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/department-leader/allotment:
 *   put:
 *     summary: Assign an employee under a leader for a department (JWT required)
 *     tags: [DepartmentLeader]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, leaderId, departmentType]
 *             properties:
 *               employeeId:
 *                 type: integer
 *               leaderId:
 *                 type: integer
 *               departmentType:
 *                 type: string
 *                 example: "farmers"
 *     responses:
 *       200:
 *         description: Allotment saved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put("/department-leader/allotment", verifyToken, departmentLeaderController.setAllotment);

/* =====================================================
   GET ROSTER (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/department-leader/roster:
 *   get:
 *     summary: Get all employees allotted to a leader for a department (JWT required)
 *     tags: [DepartmentLeader]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leaderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: departmentType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roster fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/department-leader/roster", verifyToken, departmentLeaderController.getRoster);

/* =====================================================
   REMOVE ALLOTMENT (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/department-leader/allotment:
 *   delete:
 *     summary: Remove an employee's allotment for a department (JWT required)
 *     tags: [DepartmentLeader]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, departmentType]
 *             properties:
 *               employeeId:
 *                 type: integer
 *               departmentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Allotment removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Allotment not found
 */
router.delete("/department-leader/allotment", verifyToken, departmentLeaderController.removeAllotment);

export default router;
