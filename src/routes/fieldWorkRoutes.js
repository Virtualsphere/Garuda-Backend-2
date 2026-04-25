import express from "express";
import * as fieldWorkController from "../controller/fieldWorkController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   ASSIGNED VILLAGE
===================================================== */

/**
 * @swagger
 * /api/fieldwork/assigned-village:
 *   post:
 *     summary: Create assigned village (Admin only)
 *     tags: [FieldWork]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *               - assignedEmployeeId
 *               - village
 *               - mandal
 *             properties:
 *               target:
 *                 type: integer
 *                 example: 100
 *               assignedStatus:
 *                 type: string
 *                 enum: [ongoing, completed]
 *                 example: "ongoing"
 *               assignedEmployeeId:
 *                 type: integer
 *                 example: 5
 *               village:
 *                 type: string
 *                 example: "Ramapuram"
 *               mandal:
 *                 type: string
 *                 example: "Chandragiri"
 *               physicalVerified:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               landCreated:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               verifiedLand:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               completeLand:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Assigned village created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/fieldwork/assigned-village", fieldWorkController.createAssignedVillage);

/**
 * @swagger
 * /api/fieldwork/assigned-village/me:
 *   get:
 *     summary: Get assigned villages for logged-in employee (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned villages fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/assigned-village/me", verifyToken, fieldWorkController.getAssignedVillageByEmployee);

/**
 * @swagger
 * /api/fieldwork/assigned-village:
 *   get:
 *     summary: Get all assigned villages (Admin only)
 *     tags: [FieldWork]
 *     responses:
 *       200:
 *         description: All assigned villages fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/assigned-village", fieldWorkController.getAllAssignedVillages);

/**
 * @swagger
 * /api/fieldwork/assigned-village/{id}:
 *   get:
 *     summary: Get assigned village by ID
 *     tags: [FieldWork]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assigned village fetched successfully
 *       404:
 *         description: Assigned village not found
 */
router.get("/fieldwork/assigned-village/:id", fieldWorkController.getAssignedVillageById);

/**
 * @swagger
 * /api/fieldwork/assigned-village:
 *   put:
 *     summary: Update assigned village
 *     tags: [FieldWork]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               listed:
 *                 type: integer
 *                 example: 10
 *               land_created:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               verified:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3, 4]
 *               complete_details:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [5]
 *               physical_verified:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [6, 7]
 *               assigned_status:
 *                 type: string
 *                 enum: [ongoing, completed]
 *     responses:
 *       200:
 *         description: Assigned village updated successfully
 *       400:
 *         description: ID is required
 *       500:
 *         description: Server error
 */
router.put("/fieldwork/assigned-village", fieldWorkController.updateAssignedVillage);

/**
 * @swagger
 * /api/fieldwork/assigned-village/{id}:
 *   delete:
 *     summary: Delete assigned village
 *     tags: [FieldWork]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assigned village deleted successfully
 *       404:
 *         description: Assigned village not found
 */
router.delete("/fieldwork/assigned-village/:id", fieldWorkController.deleteAssignedVillage);

/* =====================================================
   SESSION MANAGEMENT
===================================================== */

/**
 * @swagger
 * /api/fieldwork/session/start:
 *   post:
 *     summary: Start a work session (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: Session started successfully
 *       400:
 *         description: Session already active
 *       401:
 *         description: Unauthorized
 */
router.post("/fieldwork/session/start", verifyToken, fieldWorkController.startSessionController);

/**
 * @swagger
 * /api/fieldwork/session/expense:
 *   post:
 *     summary: Add expense to session (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - expenses
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 example: 1
 *               expenses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [BUS, OTHER]
 *                       example: "BUS"
 *                     amount:
 *                       type: number
 *                       example: 50
 *                     description:
 *                       type: string
 *                       example: "Bus ticket from A to B"
 *                     photo:
 *                       type: string
 *                       example: "https://example.com/ticket.jpg"
 *     responses:
 *       200:
 *         description: Expense added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/fieldwork/session/expense", verifyToken, fieldWorkController.addExpenseController);

/**
 * @swagger
 * /api/fieldwork/session/end:
 *   put:
 *     summary: End a work session (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_km:
 *                 type: integer
 *                 example: 1000
 *               start_photo:
 *                 type: string
 *                 example: "https://example.com/start.jpg"
 *               end_km:
 *                 type: integer
 *                 example: 1050
 *               end_photo:
 *                 type: string
 *                 example: "https://example.com/end.jpg"
 *     responses:
 *       200:
 *         description: Session ended successfully
 *       400:
 *         description: No active session found
 *       401:
 *         description: Unauthorized
 */
router.put("/fieldwork/session/end", verifyToken, fieldWorkController.endSessionController);

/**
 * @swagger
 * /api/fieldwork/sessions:
 *   get:
 *     summary: Get all sessions for logged-in employee (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/fieldwork/sessions", verifyToken, fieldWorkController.getSessionsController);

/* =====================================================
   PATH MANAGEMENT
===================================================== */

/**
 * @swagger
 * /api/fieldwork/path:
 *   post:
 *     summary: Create path (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path_type:
 *                 type: string
 *                 enum: [HIGHWAY, DOUBLE ROAD, SINGLE ROAD, GRAVEL ROAD, CAR ROAD, TRACTOR ROAD, BIKE ROAD, FOOT PATH]
 *                 example: "HIGHWAY"
 *               path:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                       example: 13.0827
 *                     longitude:
 *                       type: number
 *                       example: 80.2707
 *               photo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/path1.jpg"]
 *     responses:
 *       201:
 *         description: Path created successfully
 *       400:
 *         description: Path coordinates are required
 *       401:
 *         description: Unauthorized
 */
router.post("/fieldwork/path", verifyToken, fieldWorkController.createPathController);

/**
 * @swagger
 * /api/fieldwork/paths:
 *   get:
 *     summary: Get all paths for logged-in employee (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paths fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/fieldwork/paths", verifyToken, fieldWorkController.getPathsController);

/**
 * @swagger
 * /api/fieldwork/paths/coordinates:
 *   get:
 *     summary: Get all paths for logged-in employee (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paths fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/fieldwork/paths/coordinates", verifyToken, fieldWorkController.getPathsWithLatAndLongController);

/* =====================================================
   WORK WALLET
===================================================== */

/**
 * @swagger
 * /api/fieldwork/wallet/work:
 *   get:
 *     summary: Get work wallet (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Work wallet fetched successfully
 *       400:
 *         description: startDate and endDate are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/wallet/work", verifyToken, fieldWorkController.getWorkWallet);

/**
 * @swagger
 * /api/fieldwork/wallet/work/{id}:
 *   put:
 *     summary: Update work wallet status to COMPLETED (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Work wallet status updated to COMPLETED
 *       400:
 *         description: Wallet id is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/fieldwork/wallet/work/:id", verifyToken, fieldWorkController.updateWorkWalletStatus);

/* =====================================================
   TRAVEL WALLET
===================================================== */

/**
 * @swagger
 * /api/fieldwork/wallet/travel:
 *   get:
 *     summary: Get travel wallet (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Travel wallet fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/wallet/travel", verifyToken, fieldWorkController.getTravelWallet);

/* =====================================================
   PRIMARY VISIT (FIELD WORKER)
===================================================== */

/**
 * @swagger
 * /api/fieldwork/primary-visit/{landId}:
 *   put:
 *     summary: Update primary visit by employee (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: landId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 10
 *               meeting_status:
 *                 type: string
 *                 enum: [Scheduled, Complete, Cancelled, Postponed]
 *                 example: "Complete"
 *               visit_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               time:
 *                 type: string
 *                 format: time
 *                 example: "10:30:00"
 *               land_visit_photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/photo1.jpg"]
 *               fee_receipt:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     example: 1000
 *                   receipt_url:
 *                     type: string
 *                     example: "https://example.com/receipt.jpg"
 *               buyer_visit:
 *                 type: object
 *                 properties:
 *                   sheet_url:
 *                     type: string
 *                     example: "https://example.com/sheet.xlsx"
 *     responses:
 *       200:
 *         description: Primary visit updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/fieldwork/primary-visit/:landId", verifyToken, fieldWorkController.updatePrimaryVisit);

/* =====================================================
   PRIMARY VISIT (ADMIN ASSIGNMENT)
===================================================== */

/**
 * @swagger
 * /api/fieldwork/primary-visit/assign:
 *   post:
 *     summary: Assign employee to visit (Admin only)
 *     tags: [FieldWork]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - landId
 *               - employeeId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 10
 *               landId:
 *                 type: integer
 *                 example: 5
 *               employeeId:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Employee assigned successfully
 *       500:
 *         description: Server error
 */
router.post("/fieldwork/primary-visit/assign", fieldWorkController.assignEmployeeToVisit);

/* =====================================================
   LAND FEEDBACK
===================================================== */

/**
 * @swagger
 * /api/fieldwork/feedback:
 *   post:
 *     summary: Create land feedback (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - lands
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 10
 *               buyer_agreement:
 *                 type: string
 *                 example: "Buyer agreed to terms"
 *               lands:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - land_id
 *                   properties:
 *                     land_id:
 *                       type: integer
 *                       example: 5
 *                     feedback:
 *                       type: string
 *                       example: "Land looks good"
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/fieldwork/feedback", verifyToken, fieldWorkController.createFeedback);

/* =====================================================
   TRAINING
===================================================== */

/**
 * @swagger
 * /api/fieldwork/training:
 *   post:
 *     summary: Create training (Admin only)
 *     tags: [FieldWork]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - land_verification
 *             properties:
 *               land_verification:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=123"
 *               new_land_entry:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=456"
 *               buyer_visit_assistant:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=789"
 *               session_management:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=101"
 *               path_logging:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=112"
 *               wallet_features:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=131"
 *               profile_settings:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=415"
 *     responses:
 *       201:
 *         description: Training created successfully
 *       400:
 *         description: land_verification video URL is required
 *       500:
 *         description: Server error
 */
router.post("/fieldwork/training", fieldWorkController.createTraining);

/**
 * @swagger
 * /api/fieldwork/training:
 *   get:
 *     summary: Get training
 *     tags: [FieldWork]
 *     responses:
 *       200:
 *         description: Training fetched successfully
 *       404:
 *         description: Training data not found
 */
router.get("/fieldwork/training", fieldWorkController.getTraining);

/**
 * @swagger
 * /api/fieldwork/training:
 *   put:
 *     summary: Update training (Admin only)
 *     tags: [FieldWork]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               land_verification:
 *                 type: string
 *               new_land_entry:
 *                 type: string
 *               buyer_visit_assistant:
 *                 type: string
 *               session_management:
 *                 type: string
 *               path_logging:
 *                 type: string
 *               wallet_features:
 *                 type: string
 *               profile_settings:
 *                 type: string
 *     responses:
 *       200:
 *         description: Training updated successfully
 *       500:
 *         description: Server error
 */
router.put("/fieldwork/training", fieldWorkController.updateTraining);

/**
 * @swagger
 * /api/fieldwork/training/{id}:
 *   delete:
 *     summary: Delete training (Admin only)
 *     tags: [FieldWork]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Training deleted successfully
 *       404:
 *         description: Training not found
 */
router.delete("/fieldwork/training/:id", fieldWorkController.deleteTraining);

/* =====================================================
   AGENT MANAGEMENT
===================================================== */

/**
 * @swagger
 * /api/fieldwork/agent:
 *   post:
 *     summary: Create agent (JWT required)
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mandal
 *             properties:
 *               state:
 *                 type: string
 *                 example: "Andhra Pradesh"
 *               district:
 *                 type: string
 *                 example: "Chittoor"
 *               mandal:
 *                 type: string
 *                 example: "Chandragiri"
 *               village:
 *                 type: string
 *                 example: "Ramapuram"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Agent created successfully
 *       400:
 *         description: Mandal is required or Mandal is FULL
 *       401:
 *         description: Unauthorized
 */
router.post("/fieldwork/agent", verifyToken, fieldWorkController.createAgent);

/**
 * @swagger
 * /api/fieldwork/agents:
 *   get:
 *     summary: Get agents by location
 *     tags: [FieldWork]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         example: "Andhra Pradesh"
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         example: "Chittoor"
 *     responses:
 *       200:
 *         description: Agents fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/agents", fieldWorkController.getAgentsByLocation);

/**
 * @swagger
 * /api/fieldwork/agent/{id}:
 *   put:
 *     summary: Update agent
 *     tags: [FieldWork]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *               district:
 *                 type: string
 *               mandal:
 *                 type: string
 *               village:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *       404:
 *         description: Agent not found
 */
router.put("/fieldwork/agent/:id", fieldWorkController.updateAgent);

/**
 * @swagger
 * /api/fieldwork/agent/{id}:
 *   delete:
 *     summary: Delete agent
 *     tags: [FieldWork]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agent deleted successfully
 *       404:
 *         description: Agent not found
 */
router.delete("/fieldwork/agent/:id", fieldWorkController.deleteAgent);

/**
 * @swagger
 * /api/fieldwork/primary-visits:
 *   get:
 *     summary: Get all primary visits assigned to the logged-in employee
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Primary visits fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/primary-visits", verifyToken, fieldWorkController.getPrimaryVisitsByEmployee);

/**
 * @swagger
 * /api/fieldwork/land-feedback:
 *   get:
 *     summary: Get land feedback for the logged-in employee
 *     tags: [FieldWork]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Land feedback fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/fieldwork/land-feedback", verifyToken, fieldWorkController.getLandFeedback);

/**
 * @swagger
 * /api/attendance/calendar:
 *   get:
 *     summary: Get calendar with attendance for logged-in employee (JWT required)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Calendar with attendance fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/attendance/calendar", verifyToken, fieldWorkController.getCalendarWithAttendance);

/**
 * @swagger
 * /api/attendance/mark:
 *   post:
 *     summary: Mark attendance for logged-in employee (JWT required)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - status
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LATE, HOLIDAY, WEEKEND]
 *                 example: "PRESENT"
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/attendance/mark", verifyToken, fieldWorkController.markAttendance);

/**
 * @swagger
 * /api/attendance/admin-update:
 *   put:
 *     summary: Update attendance for any employee (Admin only)
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - date
 *               - status
 *             properties:
 *               employeeId:
 *                 type: string
 *                 example: "EMP001"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LATE, HOLIDAY, WEEKEND]
 *                 example: "PRESENT"
 *     responses:
 *       200:
 *         description: Attendance updated by admin successfully
 *       400:
 *         description: Bad request
 */
router.put("/attendance/admin-update", fieldWorkController.adminUpdateAttendance);

/**
 * @swagger
 * /api/attendance/holiday:
 *   post:
 *     summary: Add or update holiday (Admin only)
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-26"
 *               description:
 *                 type: string
 *                 example: "Republic Day"
 *     responses:
 *       200:
 *         description: Holiday added/updated successfully
 *       400:
 *         description: Bad request
 */
router.post("/attendance/holiday", fieldWorkController.addHoliday);

/**
 * @swagger
 * /api/attendance/weekends:
 *   post:
 *     summary: Mark weekends for a date range (Admin only)
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Weekends marked successfully
 *       400:
 *         description: Bad request
 */
router.post("/attendance/weekends", fieldWorkController.markWeekends);

/**
 * @swagger
 * /api/attendance/monthly-report:
 *   get:
 *     summary: Get monthly attendance report for an employee
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         example: 1
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *         example: 2024
 *         description: Year
 *     responses:
 *       200:
 *         description: Monthly report fetched successfully
 *       400:
 *         description: Bad request
 */
router.get("/attendance/monthly-report", fieldWorkController.getMonthlyReport);

export default router;