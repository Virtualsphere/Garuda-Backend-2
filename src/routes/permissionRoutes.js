import express from "express";
import * as permissionController from "../controller/permissionController.js";
import verifyToken from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* =====================================================
   GET PERMISSION CATALOG
===================================================== */

/**
 * @swagger
 * /api/permission/catalog:
 *   get:
 *     summary: List all page permissions in the catalog (JWT required)
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalog fetched successfully
 */
router.get("/permission/catalog", verifyToken, permissionController.getCatalog);

/* =====================================================
   MY EFFECTIVE PERMISSIONS
===================================================== */

/**
 * @swagger
 * /api/permission/me:
 *   get:
 *     summary: Get the effective permissions for the logged-in employee (JWT required)
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Effective permissions fetched successfully
 */
router.get("/permission/me", verifyToken, permissionController.getMyPermissions);

/* =====================================================
   ROLE PERMISSIONS (ADMIN ONLY)
===================================================== */

/**
 * @swagger
 * /api/permission/role/{roleName}:
 *   get:
 *     summary: Get the permission keys assigned to a role (admin only)
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role permissions fetched successfully
 *       403:
 *         description: Admin access required
 */
router.get("/permission/role/:roleName", verifyToken, requireAdmin, permissionController.getRolePermissions);

/**
 * @swagger
 * /api/permission/role/{roleName}:
 *   put:
 *     summary: Replace the permission set for a role (admin only)
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionKeys]
 *             properties:
 *               permissionKeys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["add_land"]
 *     responses:
 *       200:
 *         description: Role permissions updated
 *       400:
 *         description: Invalid permission keys
 *       403:
 *         description: Admin access required
 */
router.put("/permission/role/:roleName", verifyToken, requireAdmin, permissionController.setRolePermissions);

/* =====================================================
   EMPLOYEE PERMISSION OVERRIDES (ADMIN ONLY)
===================================================== */

/**
 * @swagger
 * /api/permission/employee/{employeeId}:
 *   get:
 *     summary: Get effective permissions and overrides for an employee (admin only)
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee permissions fetched successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employee not found
 */
router.get("/permission/employee/:employeeId", verifyToken, requireAdmin, permissionController.getEmployeePermissions);

/**
 * @swagger
 * /api/permission/employee/{employeeId}:
 *   put:
 *     summary: Upsert permission overrides for an employee (admin only)
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overrides]
 *             properties:
 *               overrides:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     permissionKey:
 *                       type: string
 *                       example: "add_land"
 *                     type:
 *                       type: string
 *                       enum: [ALLOW, DENY]
 *     responses:
 *       200:
 *         description: Employee permissions updated
 *       400:
 *         description: Invalid overrides
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employee not found
 */
router.put("/permission/employee/:employeeId", verifyToken, requireAdmin, permissionController.setEmployeePermissions);

export default router;
