import express from "express";
import * as agentLeadController from "../controller/agentLeadController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   LEAD QUEUES
===================================================== */

/**
 * @swagger
 * /api/agent-lead:
 *   get:
 *     summary: List agent recruitment leads, optionally by working queue
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: query
 *         name: queue
 *         schema:
 *           type: string
 *           enum: [unallotted, first-call, follow-up, not-lifted]
 *         description: The desk queue to return; omit for all active leads
 *       - in: query
 *         name: assignedEmployeeId
 *         schema: { type: integer }
 *       - in: query
 *         name: teamLeaderId
 *         schema: { type: integer }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: mandal
 *         schema: { type: string }
 *       - in: query
 *         name: source
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: activeOnly
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Leads fetched successfully
 */
router.get("/agent-lead", verifyToken, agentLeadController.listLeads);

/**
 * @swagger
 * /api/agent-lead/queue-counts:
 *   get:
 *     summary: Badge counts for every recruitment tab
 *     tags: [Agent Leads]
 *     responses:
 *       200:
 *         description: Queue counts fetched
 */
router.get("/agent-lead/queue-counts", verifyToken, agentLeadController.getQueueCounts);

/**
 * @swagger
 * /api/agent-lead/source-breakdown:
 *   get:
 *     summary: Lead volume grouped by source
 *     tags: [Agent Leads]
 *     responses:
 *       200:
 *         description: Lead source breakdown fetched
 */
router.get(
  "/agent-lead/source-breakdown",
  verifyToken,
  agentLeadController.getLeadSourceBreakdown
);

/**
 * @swagger
 * /api/agent-lead/performance:
 *   get:
 *     summary: Per-telecaller call throughput and connect rate
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Telecaller performance fetched
 */
router.get(
  "/agent-lead/performance",
  verifyToken,
  agentLeadController.getTelecallerPerformance
);

/* =====================================================
   ALLOTMENT
===================================================== */

/**
 * @swagger
 * /api/agent-lead/allot:
 *   post:
 *     summary: Hand a batch of leads to a telecaller
 *     tags: [Agent Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadIds, employeeId]
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items: { type: integer }
 *               employeeId: { type: integer }
 *               teamLeaderId: { type: integer }
 *               teamId: { type: integer }
 *               teamName: { type: string }
 *     responses:
 *       200:
 *         description: Leads allotted
 */
router.post("/agent-lead/allot", verifyToken, agentLeadController.allotLeads);

/**
 * @swagger
 * /api/agent-lead/unallot:
 *   post:
 *     summary: Return leads to the unallotted pool
 *     tags: [Agent Leads]
 *     responses:
 *       200:
 *         description: Leads returned to the pool
 */
router.post("/agent-lead/unallot", verifyToken, agentLeadController.unallotLeads);

/* =====================================================
   CALLS
===================================================== */

/**
 * @swagger
 * /api/agent-lead/call:
 *   get:
 *     summary: List recorded call attempts
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: query
 *         name: candidateId
 *         schema: { type: integer }
 *       - in: query
 *         name: employeeId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Call attempts fetched
 */
router.get("/agent-lead/call", verifyToken, agentLeadController.listCallAttempts);

/**
 * @swagger
 * /api/agent-lead/call:
 *   post:
 *     summary: Record a dial against a lead
 *     tags: [Agent Leads]
 *     description: >
 *       Writes the attempt to history and folds the outcome onto the lead.
 *       result=Proceed promotes it to INTERESTED, Not Interested closes it, and
 *       Follow Up schedules the call-back (a followUpDate is then required).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, answerStatus]
 *             properties:
 *               leadId: { type: integer }
 *               queue:
 *                 type: string
 *                 enum: [first-call, follow-up, not-lifted, tl]
 *               answerStatus:
 *                 type: string
 *                 enum: [Answered, Not Lifted, No Answer, Busy / Call Later, Invalid Number]
 *               result:
 *                 type: string
 *                 enum: [Proceed, Follow Up, Not Interested, Divert]
 *               note: { type: string }
 *               followUpDate: { type: string, format: date }
 *               followUpTime: { type: string }
 *               durationSeconds: { type: integer }
 *               recordingUrl: { type: string }
 *     responses:
 *       201:
 *         description: Call attempt recorded
 */
router.post("/agent-lead/call", verifyToken, agentLeadController.logCallAttempt);

/* =====================================================
   TEAM LEADER ESCALATION
===================================================== */

/**
 * @swagger
 * /api/agent-lead/escalation:
 *   get:
 *     summary: The team leader queue
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [All, Pending, Completed, ReturnedToTelecaller]
 *       - in: query
 *         name: teamLeaderId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Escalations fetched
 */
router.get("/agent-lead/escalation", verifyToken, agentLeadController.listEscalations);

/**
 * @swagger
 * /api/agent-lead/escalation:
 *   post:
 *     summary: Hand a lead up to a team leader
 *     tags: [Agent Leads]
 *     responses:
 *       201:
 *         description: Lead escalated
 *       409:
 *         description: The lead already has an open escalation
 */
router.post("/agent-lead/escalation", verifyToken, agentLeadController.escalateLead);

/**
 * @swagger
 * /api/agent-lead/escalation/{id}/resolve:
 *   put:
 *     summary: Close a team leader case
 *     tags: [Agent Leads]
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
 *               status:
 *                 type: string
 *                 enum: [Completed, ReturnedToTelecaller]
 *               tlNote: { type: string }
 *               tlResult: { type: string }
 *     responses:
 *       200:
 *         description: Escalation resolved
 */
router.put(
  "/agent-lead/escalation/:id/resolve",
  verifyToken,
  agentLeadController.resolveEscalation
);

/* =====================================================
   OFFICE VISITS
===================================================== */

/**
 * @swagger
 * /api/agent-lead/office-visit:
 *   get:
 *     summary: Scheduled office visits (the Onboarding queue)
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [All, Scheduled, Completed, Cancelled]
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: regionalOffice
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Office visits fetched
 */
router.get(
  "/agent-lead/office-visit",
  verifyToken,
  agentLeadController.listOfficeVisits
);

/**
 * @swagger
 * /api/agent-lead/office-visit:
 *   post:
 *     summary: Book an interested candidate in to a regional office
 *     tags: [Agent Leads]
 *     description: >
 *       Re-booking a candidate who already has a scheduled visit moves that
 *       visit rather than creating a second one.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidateId, regionalOffice, visitDate]
 *             properties:
 *               candidateId: { type: integer }
 *               regionalOffice: { type: string }
 *               visitDate: { type: string, format: date }
 *               visitTime: { type: string }
 *               interestedVillage: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Office visit scheduled
 */
router.post(
  "/agent-lead/office-visit",
  verifyToken,
  agentLeadController.scheduleOfficeVisit
);

/**
 * @swagger
 * /api/agent-lead/office-visit/{id}/status:
 *   put:
 *     summary: Mark a visit completed or cancelled
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Office visit updated
 */
router.put(
  "/agent-lead/office-visit/:id/status",
  verifyToken,
  agentLeadController.updateOfficeVisitStatus
);

/* =====================================================
   ONBOARDING
===================================================== */

/**
 * @swagger
 * /api/agent-lead/onboard:
 *   post:
 *     summary: Appoint a candidate as an agent
 *     tags: [Agent Leads]
 *     description: >
 *       One transaction: creates the agent, attaches them to the village seat,
 *       records the joining money as ledger lines and marks the candidate
 *       JOINED. Idempotent — a candidate already converted returns their
 *       existing agent. Refuses (409) unless ID proof and the signed agreement
 *       are both recorded, which allowIncompletePaperwork overrides.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidateId]
 *             properties:
 *               candidateId: { type: integer }
 *               village: { type: string }
 *               positionId: { type: integer }
 *               address: { type: string }
 *               membershipAmount: { type: number }
 *               securityDeposit: { type: number }
 *               paymentMode: { type: string }
 *               referenceNo: { type: string }
 *               idProofUploaded: { type: boolean }
 *               agreementUploaded: { type: boolean }
 *               allowIncompletePaperwork: { type: boolean }
 *               additionalVillages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     village: { type: string }
 *                     mandal: { type: string }
 *     responses:
 *       201:
 *         description: Agent onboarded successfully
 *       409:
 *         description: Paperwork incomplete
 */
router.post("/agent-lead/onboard", verifyToken, agentLeadController.onboardCandidate);

/**
 * @swagger
 * /api/agent-lead/paperwork/{agentId}:
 *   put:
 *     summary: Record or correct an agent's onboarding documents
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paperwork updated
 */
router.put(
  "/agent-lead/paperwork/:agentId",
  verifyToken,
  agentLeadController.updateAgentPaperwork
);

/**
 * @swagger
 * /api/agent-lead/onboarding-summary/{agentId}:
 *   get:
 *     summary: Ledger, villages and seat for a freshly onboarded agent
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Onboarding summary fetched
 */
router.get(
  "/agent-lead/onboarding-summary/:agentId",
  verifyToken,
  agentLeadController.getOnboardingSummary
);

/**
 * @swagger
 * /api/agent-lead/{id}:
 *   get:
 *     summary: One lead with its call, escalation and visit history
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lead fetched successfully
 */
router.get("/agent-lead/:id", verifyToken, agentLeadController.getLead);

export default router;
