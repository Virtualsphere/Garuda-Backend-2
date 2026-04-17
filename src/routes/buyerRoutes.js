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
 *       400:
 *         description: Bad request
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
 *       401:
 *         description: Unauthorized
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
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
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
 *       404:
 *         description: Not found
 */
router.put("/buyer/update", verifyToken, buyerController.updateBuyer);

/**
 * @swagger
 * /api/buyer/get:
 *   get:
 *     summary: Get user (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer fetched
 *       500:
 *         description: Server error
 */
router.get("/buyer/get", verifyToken, buyerController.getUserById);

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
 *       404:
 *         description: Not found
 */
router.delete("/buyer/delete", verifyToken, buyerController.deleteBuyer);

/* =====================================================
   LOGOUT
===================================================== */

/**
 * @swagger
 * /api/buyer/logout:
 *   post:
 *     summary: Logout buyer (JWT required)
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
 *       500:
 *         description: Server Error
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
 *       500:
 *         description: Server Error
 */
router.get("/buyer/land", buyerController.getAllLandsForUser);

/**
 * @swagger
 * /api/buyer/land/{id}:
 *   get:
 *     summary: Get land by ID
 *     tags: [Buyer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Land details
 *       404:
 *         description: Land not found
 */
router.get("/buyer/land/:id", buyerController.getLandByIdForUser);

/**
 * @swagger
 * /api/buyer/wishlist:
 *   post:
 *     summary: Add land(s) to wishlist (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *             properties:
 *               land_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Land(s) added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Land(s) added to wishlist successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/wishlist", verifyToken, buyerController.createWishList);

/**
 * @swagger
 * /api/buyer/wishlist:
 *   get:
 *     summary: Get wishlist by user (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Wishlist not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/wishlist", verifyToken, buyerController.getWishListByUser);

/**
 * @swagger
 * /api/buyer/wishlist:
 *   delete:
 *     summary: Delete wishlist items (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landIds
 *             properties:
 *               landIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       200:
 *         description: Wishlist items deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wishlist items deleted successfully"
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Wishlist items not found
 *       500:
 *         description: Server error
 */
router.delete("/buyer/wishlist", verifyToken, buyerController.deleteWishList);

/**
 * @swagger
 * /api/buyer/availability:
 *   post:
 *     summary: Create availability (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *             properties:
 *               land_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Availability created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/availability", verifyToken, buyerController.createAvailibility);

/**
 * @swagger
 * /api/buyer/availability:
 *   get:
 *     summary: Get availability (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Availability not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/availability", verifyToken, buyerController.getAvailibilityByUser);

/**
 * @swagger
 * /api/buyer/availability:
 *   delete:
 *     summary: Delete availability (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landId
 *             properties:
 *               landId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Availability deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Availability deleted successfully"
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Availability not found
 *       500:
 *         description: Server error
 */
router.delete("/buyer/availability", verifyToken, buyerController.deleteAvailibility);

/**
 * @swagger
 * /api/buyer/cart:
 *   post:
 *     summary: Add to cart (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *             properties:
 *               land_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Item(s) added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/cart", verifyToken, buyerController.createCart);

/**
 * @swagger
 * /api/buyer/cart:
 *   get:
 *     summary: Get cart (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/cart", verifyToken, buyerController.getCartByUser);

/**
 * @swagger
 * /api/buyer/cart:
 *   delete:
 *     summary: Remove from cart (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landIds
 *             properties:
 *               landIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1]
 *     responses:
 *       200:
 *         description: Item(s) removed from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item(s) removed from cart successfully"
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Cart items not found
 *       500:
 *         description: Server error
 */
router.delete("/buyer/cart", verifyToken, buyerController.deleteCart);

/**
 * @swagger
 * /api/buyer/visit:
 *   post:
 *     summary: Schedule visit (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *               - visit_date
 *               - time
 *             properties:
 *               land_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1]
 *               visit_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-20"
 *               time:
 *                 type: string
 *                 format: time
 *                 example: "10:30:00"
 *               meeting_status:
 *                 type: string
 *                 enum: [Scheduled, Completed, Cancelled]
 *                 example: "Scheduled"
 *     responses:
 *       201:
 *         description: Visit scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/visit", verifyToken, buyerController.createPrimaryVisit);

/**
 * @swagger
 * /api/buyer/visit:
 *   get:
 *     summary: Get visits (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visits fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Visits not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/visit", verifyToken, buyerController.getPrimaryVisitsByUser);

/**
 * @swagger
 * /api/buyer/visit/{id}:
 *   delete:
 *     summary: Delete visit (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Visit ID
 *     responses:
 *       200:
 *         description: Visit deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Visit deleted successfully"
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Visit not found
 *       500:
 *         description: Server error
 */
router.delete("/buyer/visit/:id", verifyToken, buyerController.deletePrimaryVisit);

/**
 * @swagger
 * /api/buyer/shortlist:
 *   post:
 *     summary: Add to shortlist (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *             properties:
 *               land_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Added to shortlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/shortlist", verifyToken, buyerController.createShortlisting);

/**
 * @swagger
 * /api/buyer/shortlist:
 *   get:
 *     summary: Get shortlist (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shortlist fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Shortlist not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/shortlist", verifyToken, buyerController.getShortlistingByUser);

/**
 * @swagger
 * /api/buyer/shortlist:
 *   delete:
 *     summary: Remove shortlist (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landId
 *             properties:
 *               landId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Removed from shortlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Removed from shortlist successfully"
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Shortlist item not found
 *       500:
 *         description: Server error
 */
router.delete("/buyer/shortlist", verifyToken, buyerController.deleteShortlisting);

/**
 * @swagger
 * /api/buyer/final:
 *   post:
 *     summary: Add to final list (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *             properties:
 *               land_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Added to final list successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/final", verifyToken, buyerController.createFinalList);

/**
 * @swagger
 * /api/buyer/final:
 *   get:
 *     summary: Get final list (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Final list fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Final list not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/final", verifyToken, buyerController.getFinalListByUser);

/**
 * @swagger
 * /api/buyer/final:
 *   delete:
 *     summary: Delete from final list (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landId
 *             properties:
 *               landId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Deleted from final list successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted from final list successfully"
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Final list item not found
 *       500:
 *         description: Server error
 */
router.delete("/buyer/final", verifyToken, buyerController.deleteFinalList);

/**
 * @swagger
 * /api/buyer/payment:
 *   post:
 *     summary: Create payment (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_id
 *               - amount
 *             properties:
 *               land_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1]
 *               amount:
 *                 type: number
 *                 example: 50000
 *               payment_status:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/buyer/payment", verifyToken, buyerController.createPayment);

/**
 * @swagger
 * /api/buyer/payment:
 *   get:
 *     summary: Get payments (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments fetched successfully
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Payments not found
 *       500:
 *         description: Server error
 */
router.get("/buyer/payment", verifyToken, buyerController.getPaymentsByUser);

/**
 * @swagger
 * /api/buyer/payment/{landId}:
 *   get:
 *     summary: Get payment by land (JWT required)
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: landId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Land ID
 *     responses:
 *       200:
 *         description: Payment details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Payment not found for this land
 *       500:
 *         description: Server error
 */
router.get("/buyer/payment/:landId", verifyToken, buyerController.getPaymentByLand);

export default router;