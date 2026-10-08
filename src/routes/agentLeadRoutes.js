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
 *       - in: query
 *         name: pool
 *         schema:
 *           type: string
 *           enum: [recovery, dumped]
 *         description: >
 *           recovery = Not Lifted / No Answer / Invalid Number leads still open
 *           (including NOT_ELIGIBLE invalid numbers); dumped = the NOT_RESPONDING
 *           archive. Replaces the activeOnly default.
 *       - in: query
 *         name: includeWhatsapp
 *         schema: { type: boolean, default: false }
 *         description: Attach each lead's whatsappTrail
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
 * /api/agent-lead/interested:
 *   get:
 *     summary: The Interested tab — candidates who said yes, not yet agents
 *     tags: [Agent Leads]
 *     description: >
 *       Leads in INTERESTED, VILLAGE_INTEREST, SELECTED or OFFICE_VISIT, each
 *       with proceedAttempt (latest call marked Proceed, with its caller),
 *       escalation (latest team-leader escalation, with telecaller and team
 *       leader) and scheduledVisit (the currently booked office visit), or null.
 *     responses:
 *       200:
 *         description: Interested candidates fetched
 */
router.get("/agent-lead/interested", verifyToken, agentLeadController.listInterested);

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
   WHATSAPP TRAIL
===================================================== */

/**
 * @swagger
 * /api/agent-lead/{id}/whatsapp:
 *   post:
 *     summary: Log a WhatsApp message sent to a lead
 *     tags: [Agent Leads]
 *     description: >
 *       The desk sends through a wa.me link in the browser; this records that
 *       it was sent, by whom and with what text. It appears in the lead's
 *       whatsappTrail on GET /api/agent-lead/{id}.
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
 *             required: [messageText]
 *             properties:
 *               templateName: { type: string }
 *               messageText: { type: string }
 *               callerEmployeeId:
 *                 type: integer
 *                 description: Credit a colleague at a shared desk instead of the logged-in user
 *     responses:
 *       201:
 *         description: WhatsApp message logged
 *       404:
 *         description: Lead not found
 */
router.post("/agent-lead/:id/whatsapp", verifyToken, agentLeadController.logWhatsapp);

/* =====================================================
   RECOVERY HUB (NOT LIFTED & INVALID)
   The open list is GET /api/agent-lead?pool=recovery&includeWhatsapp=true
   and the archive GET /api/agent-lead?pool=dumped.
===================================================== */

/**
 * @swagger
 * /api/agent-lead/{id}/phone:
 *   put:
 *     summary: Correct a lead's phone number
 *     tags: [Agent Leads]
 *     description: >
 *       The lead stays in the recovery pool until a call on the new number
 *       connects. The change is written to the candidate's status history.
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
 *             required: [phone]
 *             properties:
 *               phone: { type: string, description: 10-digit mobile; +91 / 0 prefix accepted }
 *               note: { type: string }
 *               callerEmployeeId: { type: integer }
 *     responses:
 *       200:
 *         description: Phone number updated
 *       400:
 *         description: Not a valid mobile number, or unchanged
 *       404:
 *         description: Lead not found
 */
router.put("/agent-lead/:id/phone", verifyToken, agentLeadController.updateLeadPhone);

/**
 * @swagger
 * /api/agent-lead/{id}/dump:
 *   post:
 *     summary: Retire an unreachable lead to the dumped archive
 *     tags: [Agent Leads]
 *     description: >
 *       Sets the lead to NOT_RESPONDING, recording who dumped it and why. The
 *       previous status is remembered so a restore is exact.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *               callerEmployeeId:
 *                 type: integer
 *                 description: Credit a colleague at a shared desk instead of the logged-in user
 *     responses:
 *       200:
 *         description: Lead dumped
 *       409:
 *         description: Already dumped, or already closed
 */
router.post("/agent-lead/:id/dump", verifyToken, agentLeadController.dumpLead);

/**
 * @swagger
 * /api/agent-lead/{id}/restore:
 *   post:
 *     summary: Restore a dumped lead to the status it had before
 *     tags: [Agent Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lead restored
 *       409:
 *         description: The lead is not dumped
 */
router.post("/agent-lead/:id/restore", verifyToken, agentLeadController.restoreLead);

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
 *       409:
 *         description: The escalation is no longer Pending
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
