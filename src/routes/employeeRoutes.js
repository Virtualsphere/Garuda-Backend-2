import express from "express";
import * as employeeController from "../controller/employeeController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   SIGNUP
===================================================== */

/**
 * @swagger
 * /api/employee/signup:
 *   post:
 *     summary: Employee Signup
 *     tags: [Employee]
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
 *                 example: "Ravi Kumar"
 *
 *               role:
 *                 type: string
 *                 example: "FIELD_AGENT"
 *
 *               secondary_role:
 *                 type: object
 *                 example: { "role2": "MANAGER" }
 *
 *               email:
 *                 type: string
 *                 example: "ravi@gmail.com"
 *
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *
 *               other_phone:
 *                 type: string
 *                 example: "9123456780"
 *
 *               password:
 *                 type: string
 *                 example: "password123"
 *
 *               blood_group:
 *                 type: string
 *                 example: "B+"
 *
 *               about:
 *                 type: string
 *                 example: "Field agent working in agriculture sector"
 *
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DEACTIVE]
 *
 *               aadhar_number:
 *                 type: string
 *                 example: "123456789012"
 *
 *               aadhar_photo:
 *                 type: string
 *                 example: "https://example.com/aadhar.jpg"
 *
 *               bank_name:
 *                 type: string
 *                 example: "SBI"
 *
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *
 *               ifsc_code:
 *                 type: string
 *                 example: "SBIN0001234"
 *
 *               phone_pe_number:
 *                 type: string
 *                 example: "9876543210"
 *
 *               google_pay_number:
 *                 type: string
 *                 example: "9876543210"
 *
 *               upi_id:
 *                 type: string
 *                 example: "ravi@upi"
 *
 *               address:
 *                 type: string
 *                 example: "Hyderabad, Telangana"
 *
 *               shirt_size:
 *                 type: string
 *                 example: "L"
 *
 *               work_state:
 *                 type: string
 *                 example: "Telangana"
 *
 *               work_district:
 *                 type: object
 *                 example:
 *                   - "Hyderabad"
 *                   - "other"
 *
 *               work_mandal:
 *                 type: object
 *                 example:
 *                   - "Shamshabad"
 *                   - "other"
 *
 *               work_village:
 *                 type: object
 *                 example:
 *                   - "Kothur"
 *                   - "other"
 *
 *               salary_package:
 *                 type: string
 *                 example: "30000/month"
 *
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post("/employee/signup", employeeController.signup);

/* =====================================================
   LOGIN
===================================================== */

/**
 * @swagger
 * /api/employee/login:
 *   post:
 *     summary: Employee Login
 *     tags: [Employee]
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
 *                 example: "ravi@gmail.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/employee/login", employeeController.login);

/* =====================================================
   REFRESH TOKEN
===================================================== */

/**
 * @swagger
 * /api/employee/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Employee]
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
router.post("/employee/refresh", employeeController.refreshToken);

/* =====================================================
   UPDATE EMPLOYEE (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/employee/update:
 *   put:
 *     summary: Update employee profile (JWT required)
 *     tags: [Employee]
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
 *                 example: "Ravi Kumar"
 *
 *               role:
 *                 type: string
 *                 example: "FIELD_AGENT"
 *
 *               secondary_role:
 *                 type: object
 *                 example: { "role2": "MANAGER" }
 *
 *               email:
 *                 type: string
 *                 example: "ravi@gmail.com"
 *
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *
 *               other_phone:
 *                 type: string
 *                 example: "9123456780"
 *
 *               blood_group:
 *                 type: string
 *                 example: "B+"
 *
 *               about:
 *                 type: string
 *                 example: "Field agent working in agriculture sector"
 *
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DEACTIVE]
 *
 *               aadhar_number:
 *                 type: string
 *                 example: "123456789012"
 *
 *               aadhar_photo:
 *                 type: string
 *                 example: "https://example.com/aadhar.jpg"
 *
 *               bank_name:
 *                 type: string
 *                 example: "SBI"
 *
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *
 *               ifsc_code:
 *                 type: string
 *                 example: "SBIN0001234"
 *
 *               phone_pe_number:
 *                 type: string
 *                 example: "9876543210"
 *
 *               google_pay_number:
 *                 type: string
 *                 example: "9876543210"
 *
 *               upi_id:
 *                 type: string
 *                 example: "ravi@upi"
 *
 *               address:
 *                 type: string
 *                 example: "Hyderabad, Telangana"
 *
 *               shirt_size:
 *                 type: string
 *                 example: "L"
 *
 *               work_state:
 *                 type: string
 *                 example: "Telangana"
 *
 *               work_district:
 *                 type: object
 *                 example:
 *                   - "Hyderabad"
 *                   - "other"
 *
 *               work_mandal:
 *                 type: object
 *                 example:
 *                   - "Shamshabad"
 *                   - "other"
 *
 *               work_village:
 *                 type: object
 *                 example:
 *                   - "Kothur"
 *                   - "other"
 *
 *               salary_package:
 *                 type: string
 *                 example: "30000/month"
 *     responses:
 *       200:
 *         description: Employee updated successfully
 */
router.put("/update", verifyToken, employeeController.updateEmployee);

/* =====================================================
   DELETE EMPLOYEE (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/employee/delete:
 *   delete:
 *     summary: Delete employee (JWT required)
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 */
router.delete("/employee/delete", verifyToken, employeeController.deleteEmployee);

/* =====================================================
   LOGOUT
===================================================== */

/**
 * @swagger
 * /api/employee/logout:
 *   post:
 *     summary: Logout employee
 *     tags: [Employee]
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
router.post("/employee/logout", employeeController.logout);

export default router;