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
 *               role:
 *                 type: string
 *                 example: "FIELD_AGENT"
 *               secondary_role:
 *                 type: object
 *                 example: { "role2": "MANAGER" }
 *               email:
 *                 type: string
 *                 example: "ravi@gmail.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               other_phone:
 *                 type: string
 *                 example: "9123456780"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               blood_group:
 *                 type: string
 *                 example: "B+"
 *               about:
 *                 type: string
 *                 example: "Field agent working in agriculture sector"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DEACTIVE]
 *               aadhar_number:
 *                 type: string
 *                 example: "123456789012"
 *               aadhar_photo:
 *                 type: string
 *                 example: "https://example.com/aadhar.jpg"
 *               bank_name:
 *                 type: string
 *                 example: "SBI"
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *               ifsc_code:
 *                 type: string
 *                 example: "SBIN0001234"
 *               phone_pe_number:
 *                 type: string
 *                 example: "9876543210"
 *               google_pay_number:
 *                 type: string
 *                 example: "9876543210"
 *               upi_id:
 *                 type: string
 *                 example: "ravi@upi"
 *               address:
 *                 type: string
 *                 example: "Hyderabad, Telangana"
 *               shirt_size:
 *                 type: string
 *                 example: "L"
 *               work_state:
 *                 type: string
 *                 example: "Telangana"
 *               work_district:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Hyderabad", "Rangareddy"]
 *               work_mandal:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Shamshabad", "Rajendranagar"]
 *               work_village:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Kothur", "Moinabad"]
 *               new_land_price:
 *                 type: number
 *                 example: 250
 *               verification_price:
 *                 type: number
 *                 example: 40
 *               buyer_visit_price:
 *                 type: number
 *                 example: 100
 *               referal_price:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Bad request
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
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
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
 *     responses:
 *       200:
 *         description: New access token generated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/employee/refresh", employeeController.refreshToken);

/* =====================================================
   GET PROFILE (PROTECTED)
===================================================== */

/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     summary: Get employee profile with work location and salary package (JWT required)
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     working_location:
 *                       type: object
 *                       properties:
 *                         state:
 *                           type: string
 *                         district:
 *                           type: array
 *                         mandal:
 *                           type: array
 *                         village:
 *                           type: array
 *                     salary_package:
 *                       type: object
 *                       properties:
 *                         new_land_price:
 *                           type: number
 *                         verification_price:
 *                           type: number
 *                         buyer_visit_price:
 *                           type: number
 *                         referral_price:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 */
router.get("/employee/profile", verifyToken, employeeController.getEmployeeProfile);

/* =====================================================
   GET ALL EMPLOYEES
===================================================== */

/**
 * @swagger
 * /api/employee/all:
 *   get:
 *     summary: Get all employees (Admin only)
 *     tags: [Employee]
 *     responses:
 *       200:
 *         description: Employees fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/employee/all", employeeController.getAllEmployees);

/* =====================================================
   GET EMPLOYEE BY ID
===================================================== */

/**
 * @swagger
 * /api/employee/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee fetched successfully
 *       404:
 *         description: Employee not found
 */
router.get("/employee/:id", employeeController.getEmployeeById);

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
 *               phone:
 *                 type: string
 *               other_phone:
 *                 type: string
 *               blood_group:
 *                 type: string
 *               about:
 *                 type: string
 *               photo:
 *                 type: string
 *               address:
 *                 type: string
 *               shirt_size:
 *                 type: string
 *               bank_name:
 *                 type: string
 *               account_number:
 *                 type: string
 *               ifsc_code:
 *                 type: string
 *               upi_id:
 *                 type: string
 *               phone_pe_number:
 *                 type: string
 *               google_pay_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Not found
 */
router.put("/employee/update", verifyToken, employeeController.updateEmployee);

/**
 * @swagger
 * /api/employee/update/{id}:
 *   put:
 *     summary: Update employee by ID (Admin only)
 *     tags: [Employee]
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
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 */
router.put("/employee/update/:id", employeeController.updateEmployee);

/* =====================================================
   UPDATE SALARY PACKAGE
===================================================== */

/**
 * @swagger
 * /api/employee/salary-package/{id}:
 *   put:
 *     summary: Update employee salary package
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               new_land_price:
 *                 type: number
 *                 example: 250
 *               verification_price:
 *                 type: number
 *                 example: 40
 *               buyer_visit_price:
 *                 type: number
 *                 example: 100
 *               referal_price:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Salary package updated successfully
 *       404:
 *         description: Employee not found
 */
router.put("/employee/salary-package/:id", employeeController.updateSalaryPackage);

/* =====================================================
   UPDATE WORK LOCATION
===================================================== */

/**
 * @swagger
 * /api/employee/work-location/{id}:
 *   put:
 *     summary: Update employee work location
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               work_state:
 *                 type: string
 *                 example: "Telangana"
 *               work_district:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Hyderabad", "Rangareddy"]
 *               work_mandal:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Shamshabad"]
 *               work_village:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Kothur", "Moinabad"]
 *     responses:
 *       200:
 *         description: Work location updated successfully
 *       404:
 *         description: Employee not found
 */
router.put("/employee/work-location/:id", employeeController.updateWorkLocation);

/* =====================================================
   DELETE EMPLOYEE
===================================================== */

/**
 * @swagger
 * /api/employee/delete/{id}:
 *   delete:
 *     summary: Delete employee (Admin only)
 *     tags: [Employee]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Not found
 */
router.delete("/employee/delete/:id", employeeController.deleteEmployee);

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
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Server Error
 */
router.post("/employee/logout", employeeController.logout);

export default router;