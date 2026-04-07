import express from "express";
import * as buyerController from "../controller/buyerController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   SIGNUP
===================================================== */

/**
 * @swagger
 * /api/buyer/signup:
 *   post:
 *     summary: Buyer Signup
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Rahul Sharma"
 *
 *               email:
 *                 type: string
 *                 example: "rahul@gmail.com"
 *
 *               password:
 *                 type: string
 *                 example: "password123"
 *
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *
 *               photo:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *
 *     responses:
 *       201:
 *         description: Signup successful
 */
router.post("/buyer/signup", buyerController.signup);

/* =====================================================
   LOGIN
===================================================== */

/**
 * @swagger
 * /api/buyer/login:
 *   post:
 *     summary: Buyer Login
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "rahul@gmail.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/buyer/login", buyerController.login);

/* =====================================================
   REFRESH TOKEN
===================================================== */

/**
 * @swagger
 * /api/buyer/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "your_refresh_token_here"
 *
 *     responses:
 *       200:
 *         description: New access token generated
 */
router.post("/buyer/refresh", buyerController.refreshToken);

/* =====================================================
   UPDATE BUYER (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/buyer/update:
 *   put:
 *     summary: Update buyer profile (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               photo:
 *                 type: string
 *
 *     responses:
 *       200:
 *         description: Buyer updated successfully
 */
router.put("/buyer/update", verifyToken, buyerController.updateBuyer);

/* =====================================================
   DELETE BUYER (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/buyer/delete:
 *   delete:
 *     summary: Delete buyer (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer deleted successfully
 */
router.delete("/buyer/delete", verifyToken, buyerController.deleteBuyer);

/* =====================================================
   LOGOUT
===================================================== */

/**
 * @swagger
 * /api/buyer/logout:
 *   post:
 *     summary: Logout buyer
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "your_refresh_token_here"
 *
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/buyer/logout", buyerController.logout);

/**
 * @swagger
 * /api/buyer/land:
 *   get:
 *     summary: Get all lands
 *     tags: [Buyer]
 *     responses:
 *       200:
 *         description: List of lands
 */
router.get("/buyer/land", buyerController.getAllLandsForUser);

export default router;