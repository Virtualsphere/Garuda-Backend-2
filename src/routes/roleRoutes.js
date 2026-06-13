import express from "express";
import * as roleController from "../controller/roleController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CREATE ROLE (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/role:
 *   post:
 *     summary: Create a new role (JWT required)
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Admin"
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Role name is required
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Role with this name already exists
 *       500:
 *         description: Internal server error
 */
router.post("/role", verifyToken, roleController.createRole);

/* =====================================================
   GET ALL ROLES
===================================================== */

/**
 * @swagger
 * /api/role:
 *   get:
 *     summary: Get all roles
 *     tags: [Role]
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Roles fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       500:
 *         description: Internal server error
 */
router.get("/role", roleController.getAllRoles);

/* =====================================================
   GET ROLE BY ID
===================================================== */

/**
 * @swagger
 * /api/role/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Role]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get("/role/:id", roleController.getRoleById);

/* =====================================================
   UPDATE ROLE (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/role/{id}:
 *   put:
 *     summary: Update a role (JWT required)
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Super Admin"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Role name is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role with this name already exists
 *       500:
 *         description: Internal server error
 */
router.put("/role/:id", verifyToken, roleController.updateRole);

/* =====================================================
   DELETE ROLE (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/role/{id}:
 *   delete:
 *     summary: Delete a role (JWT required)
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.delete("/role/:id", verifyToken, roleController.deleteRole);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Admin"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 */