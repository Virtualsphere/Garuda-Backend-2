import express from "express";
import * as agentEnquiryController from "../controller/agentEnquiryController.js";
import * as agentFinanceController from "../controller/agentFinanceController.js";
import * as agentObservationController from "../controller/agentObservationController.js";
import * as agentCoordinationController from "../controller/agentCoordinationController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   AGENT ENQUIRIES
===================================================== */

/**
 * @swagger
 * /api/agent-enquiry:
 *   get:
 *     summary: List inbound agent-desk enquiries
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: NEW, CALLBACK_PENDING, IN_PROGRESS, RESOLVED, CONVERTED_TO_LEAD, CLOSED
 *       - in: query
 *         name: enquiryType
 *         schema: { type: string }
 *       - in: query
 *         name: callerType
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: mandal
 *         schema: { type: string }
 *       - in: query
 *         name: village
 *         schema: { type: string }
 *       - in: query
 *         name: openOnly
 *         schema: { type: boolean }
 *         description: Keep only enquiries still being worked
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches caller name, phone, enquiry code or village
 *     responses:
 *       200:
 *         description: Enquiries fetched successfully
 */
router.get("/agent-enquiry", verifyToken, agentEnquiryController.listEnquiries);

/**
 * @swagger
 * /api/agent-enquiry/stats:
 *   get:
 *     summary: Enquiry counts by status, type and caller type
 *     tags: [Agent Desk]
 *     responses:
 *       200:
 *         description: Enquiry stats fetched
 */
router.get("/agent-enquiry/stats", verifyToken, agentEnquiryController.getEnquiryStats);

/**
 * @swagger
 * /api/agent-enquiry/match:
 *   get:
 *     summary: Look up an existing agent or candidate by phone
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Caller lookup complete (result is null when unknown)
 */
router.get("/agent-enquiry/match", verifyToken, agentEnquiryController.matchCaller);

/**
 * @swagger
 * /api/agent-enquiry:
 *   post:
 *     summary: Log an inbound enquiry
 *     tags: [Agent Desk]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [callerName, callerPhone]
 *             properties:
 *               callerName: { type: string }
 *               callerPhone: { type: string }
 *               callerType: { type: string }
 *               enquiryType: { type: string }
 *               state: { type: string }
 *               district: { type: string }
 *               mandal: { type: string }
 *               village: { type: string }
 *               preferredVillage: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Enquiry logged successfully
 */
router.post("/agent-enquiry", verifyToken, agentEnquiryController.createEnquiry);

/**
 * @swagger
 * /api/agent-enquiry/{id}:
 *   get:
 *     summary: Get one enquiry
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Enquiry fetched successfully
 */
router.get("/agent-enquiry/:id", verifyToken, agentEnquiryController.getEnquiry);

/**
 * @swagger
 * /api/agent-enquiry/{id}:
 *   put:
 *     summary: Update an enquiry
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Enquiry updated successfully
 */
router.put("/agent-enquiry/:id", verifyToken, agentEnquiryController.updateEnquiry);

/**
 * @swagger
 * /api/agent-enquiry/{id}/status:
 *   put:
 *     summary: Move an enquiry to a new status
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Enquiry status updated
 */
router.put(
  "/agent-enquiry/:id/status",
  verifyToken,
  agentEnquiryController.updateEnquiryStatus
);

/**
 * @swagger
 * /api/agent-enquiry/{id}/convert:
 *   post:
 *     summary: Promote an enquiry into the recruitment pipeline
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Enquiry converted to candidate
 *       409:
 *         description: Caller is already an appointed agent
 */
router.post(
  "/agent-enquiry/:id/convert",
  verifyToken,
  agentEnquiryController.convertEnquiry
);

/**
 * @swagger
 * /api/agent-enquiry/{id}:
 *   delete:
 *     summary: Delete an enquiry
 *     tags: [Agent Desk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Enquiry deleted successfully
 */
router.delete("/agent-enquiry/:id", verifyToken, agentEnquiryController.deleteEnquiry);

/* =====================================================
   AGENT FINANCE LEDGER
===================================================== */

/**
 * @swagger
 * /api/agent-transaction:
 *   get:
 *     summary: List agent finance transactions
 *     tags: [Agent Finance]
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *         description: MEMBERSHIP_FEE, COMMISSION, INCENTIVE, ADVANCE, ADVANCE_RECOVERY, PENALTY, REFUND, OTHER
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Transactions fetched successfully
 */
router.get("/agent-transaction", verifyToken, agentFinanceController.listTransactions);

/**
 * @swagger
 * /api/agent-transaction/summary:
 *   get:
 *     summary: Department finance rollup
 *     tags: [Agent Finance]
 *     responses:
 *       200:
 *         description: Finance summary fetched
 */
router.get(
  "/agent-transaction/summary",
  verifyToken,
  agentFinanceController.getFinanceSummary
);

/**
 * @swagger
 * /api/agent-transaction/ledger/{agentId}:
 *   get:
 *     summary: One agent's ledger with running balance
 *     tags: [Agent Finance]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Agent ledger fetched
 */
router.get(
  "/agent-transaction/ledger/:agentId",
  verifyToken,
  agentFinanceController.getAgentLedger
);

/**
 * @swagger
 * /api/agent-transaction:
 *   post:
 *     summary: Record a transaction against an agent
 *     tags: [Agent Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agentId, type, amount]
 *             properties:
 *               agentId: { type: integer }
 *               type: { type: string }
 *               amount: { type: number }
 *               status: { type: string }
 *               paymentMode: { type: string }
 *               referenceNo: { type: string }
 *               landId: { type: integer }
 *               transactionDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Transaction recorded successfully
 */
router.post("/agent-transaction", verifyToken, agentFinanceController.createTransaction);

/**
 * @swagger
 * /api/agent-transaction/{id}:
 *   get:
 *     summary: Get one transaction
 *     tags: [Agent Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction fetched successfully
 */
router.get("/agent-transaction/:id", verifyToken, agentFinanceController.getTransaction);

/**
 * @swagger
 * /api/agent-transaction/{id}:
 *   put:
 *     summary: Update a transaction that has not settled
 *     tags: [Agent Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       409:
 *         description: A settled transaction cannot be re-priced
 */
router.put(
  "/agent-transaction/:id",
  verifyToken,
  agentFinanceController.updateTransaction
);

/**
 * @swagger
 * /api/agent-transaction/{id}/status:
 *   put:
 *     summary: Move a transaction through its approval chain
 *     tags: [Agent Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Transaction status updated
 */
router.put(
  "/agent-transaction/:id/status",
  verifyToken,
  agentFinanceController.updateTransactionStatus
);

/**
 * @swagger
 * /api/agent-transaction/{id}:
 *   delete:
 *     summary: Delete an unsettled transaction
 *     tags: [Agent Finance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       409:
 *         description: A settled transaction cannot be deleted
 */
router.delete(
  "/agent-transaction/:id",
  verifyToken,
  agentFinanceController.deleteTransaction
);

/* =====================================================
   LAND OBSERVATIONS
===================================================== */

/**
 * @swagger
 * /api/agent-observation/assignment:
 *   get:
 *     summary: List standing observation assignments
 *     tags: [Agent Observations]
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema: { type: integer }
 *       - in: query
 *         name: landId
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: dueOnly
 *         schema: { type: boolean }
 *         description: Only assignments whose next report is due
 *     responses:
 *       200:
 *         description: Observations fetched successfully
 */
router.get(
  "/agent-observation/assignment",
  verifyToken,
  agentObservationController.listObservations
);

/**
 * @swagger
 * /api/agent-observation/assignment:
 *   post:
 *     summary: Assign an agent to observe a land parcel
 *     tags: [Agent Observations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [landId, agentId]
 *             properties:
 *               landId: { type: integer }
 *               agentId: { type: integer }
 *               frequency:
 *                 type: string
 *                 description: ONE_TIME, WEEKLY, 15_DAYS, MONTHLY, ON_REQUEST
 *               nextDueDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Observation assigned successfully
 *       409:
 *         description: Agent is already the primary agent on this land
 */
router.post(
  "/agent-observation/assignment",
  verifyToken,
  agentObservationController.assignObservation
);

/**
 * @swagger
 * /api/agent-observation/assignment/bulk:
 *   post:
 *     summary: Assign several agents to several lands at once
 *     tags: [Agent Observations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [landIds, agentIds]
 *             properties:
 *               landIds:
 *                 type: array
 *                 items: { type: integer }
 *               agentIds:
 *                 type: array
 *                 items: { type: integer }
 *               frequency: { type: string }
 *               nextDueDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Observations assigned; skipped pairs are reported
 */
router.post(
  "/agent-observation/assignment/bulk",
  verifyToken,
  agentObservationController.assignObservationsBulk
);

/**
 * @swagger
 * /api/agent-observation/assignment/mark-due:
 *   post:
 *     summary: Flip every assignment whose report has come due to INFORMATION_DUE
 *     tags: [Agent Observations]
 *     responses:
 *       200:
 *         description: Due observations marked
 */
router.post(
  "/agent-observation/assignment/mark-due",
  verifyToken,
  agentObservationController.markDueObservations
);

/**
 * @swagger
 * /api/agent-observation/assignment/{id}:
 *   get:
 *     summary: Get one observation with its submission history
 *     tags: [Agent Observations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Observation fetched successfully
 */
router.get(
  "/agent-observation/assignment/:id",
  verifyToken,
  agentObservationController.getObservation
);

/**
 * @swagger
 * /api/agent-observation/assignment/{id}:
 *   put:
 *     summary: Change an observation's cadence, due date or status
 *     tags: [Agent Observations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Observation updated successfully
 */
router.put(
  "/agent-observation/assignment/:id",
  verifyToken,
  agentObservationController.updateObservation
);

/**
 * @swagger
 * /api/agent-observation/assignment/{id}:
 *   delete:
 *     summary: Remove an observation assignment
 *     tags: [Agent Observations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Observation removed successfully
 */
router.delete(
  "/agent-observation/assignment/:id",
  verifyToken,
  agentObservationController.removeObservation
);

/**
 * @swagger
 * /api/agent-observation/submission:
 *   get:
 *     summary: List observation reports
 *     tags: [Agent Observations]
 *     parameters:
 *       - in: query
 *         name: observationId
 *         schema: { type: integer }
 *       - in: query
 *         name: landId
 *         schema: { type: integer }
 *       - in: query
 *         name: agentId
 *         schema: { type: integer }
 *       - in: query
 *         name: verificationStatus
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Submissions fetched successfully
 */
router.get(
  "/agent-observation/submission",
  verifyToken,
  agentObservationController.listSubmissions
);

/**
 * @swagger
 * /api/agent-observation/submission:
 *   post:
 *     summary: File what an agent found on the ground
 *     tags: [Agent Observations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [observationId]
 *             properties:
 *               observationId: { type: integer }
 *               isAvailable: { type: string }
 *               ownerWillingToSell: { type: string }
 *               reportedPricePerAcre: { type: number }
 *               buyerActivity: { type: string }
 *               landSold: { type: string }
 *               agreementMade: { type: string }
 *               conditionChange: { type: string }
 *               localIssue: { type: string }
 *               remarks: { type: string }
 *               photos:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Observation information submitted
 */
router.post(
  "/agent-observation/submission",
  verifyToken,
  agentObservationController.submitInformation
);

/**
 * @swagger
 * /api/agent-observation/submission/{id}/verify:
 *   put:
 *     summary: Approve or reject an observation report
 *     tags: [Agent Observations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verificationStatus]
 *             properties:
 *               verificationStatus:
 *                 type: string
 *                 description: APPROVED or REJECTED
 *               verifiedPricePerAcre: { type: number }
 *     responses:
 *       200:
 *         description: Submission verified
 */
router.put(
  "/agent-observation/submission/:id/verify",
  verifyToken,
  agentObservationController.verifySubmission
);


/* =====================================================
   COORDINATION WING LOAD
===================================================== */

/**
 * @swagger
 * /api/agent-coordination/load:
 *   get:
 *     summary: Agents per coordination executive, and how many are unassigned
 *     tags: [Agent Desk]
 *     responses:
 *       200:
 *         description: Load fetched
 */
router.get(
  "/agent-coordination/load",
  verifyToken,
  agentCoordinationController.getCoordinationLoad
);

/**
 * @swagger
 * /api/agent-coordination/assign:
 *   put:
 *     summary: Move agents onto a coordination executive (null returns them to the pool)
 *     tags: [Agent Desk]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agentIds]
 *             properties:
 *               agentIds:
 *                 type: array
 *                 items: { type: integer }
 *               executiveId:
 *                 type: integer
 *                 nullable: true
 *               allowOverQuota:
 *                 type: boolean
 *                 description: Permit exceeding the 500-agent quota
 *     responses:
 *       200:
 *         description: Agents reassigned
 *       409:
 *         description: Would exceed the 500-agent quota
 */
router.put(
  "/agent-coordination/assign",
  verifyToken,
  agentCoordinationController.assignCoordinationExecutive
);

export default router;
