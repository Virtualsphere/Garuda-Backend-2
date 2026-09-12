import express from "express";
import * as recruitmentController from "../controller/recruitmentController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CANDIDATES
===================================================== */

/**
 * @swagger
 * /api/recruitment/candidate:
 *   get:
 *     summary: List agent candidates
 *     tags: [Recruitment]
 *     parameters:
 *       - in: query
 *         name: state
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
 *         name: status
 *         schema: { type: string }
 *         description: Pipeline status, e.g. NEW_LEAD or SELECTED
 *       - in: query
 *         name: activeOnly
 *         schema: { type: boolean }
 *         description: Exclude rejected / withdrawn / duplicate candidates
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches name or phone
 *     responses:
 *       200:
 *         description: Candidates fetched successfully
 */
router.get("/recruitment/candidate", verifyToken, recruitmentController.listCandidates);

/**
 * @swagger
 * /api/recruitment/candidate:
 *   post:
 *     summary: Create an agent candidate (lead)
 *     tags: [Recruitment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, example: "Ravi Kumar" }
 *               phone: { type: string, example: "9848012345" }
 *               state: { type: string, example: "Telangana" }
 *               district: { type: string, example: "Nagarkurnool" }
 *               mandal: { type: string, example: "Kollapur" }
 *               village: { type: string, example: "Panjugula" }
 *               lead_source: { type: string, example: "META_ADS" }
 *     responses:
 *       201:
 *         description: Candidate created successfully
 */
router.post("/recruitment/candidate", verifyToken, recruitmentController.createCandidate);

/**
 * @swagger
 * /api/recruitment/candidate/{id}:
 *   get:
 *     summary: Get one candidate with village interests and status history
 *     tags: [Recruitment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Candidate fetched successfully
 *       404:
 *         description: Candidate not found
 */
router.get("/recruitment/candidate/:id", verifyToken, recruitmentController.getCandidate);

/**
 * @swagger
 * /api/recruitment/candidate/{id}:
 *   put:
 *     summary: Update candidate details (status changes use the /status route)
 *     tags: [Recruitment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 */
router.put("/recruitment/candidate/:id", verifyToken, recruitmentController.updateCandidate);

/**
 * @swagger
 * /api/recruitment/candidate/{id}/status:
 *   put:
 *     summary: Move a candidate to a new pipeline stage (writes status history)
 *     tags: [Recruitment]
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
 *               status: { type: string, example: "INTERESTED" }
 *               notes: { type: string, example: "Called back, keen on Panjugula" }
 *     responses:
 *       200:
 *         description: Candidate status updated successfully
 */
router.put(
  "/recruitment/candidate/:id/status",
  verifyToken,
  recruitmentController.updateCandidateStatus
);

/**
 * @swagger
 * /api/recruitment/candidate/{id}/convert:
 *   post:
 *     summary: Appoint a selected candidate as an agent and fill their seat
 *     tags: [Recruitment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Candidate appointed as agent
 *       409:
 *         description: Candidate has no selected seat, or is already appointed
 */
router.post(
  "/recruitment/candidate/:id/convert",
  verifyToken,
  recruitmentController.convertCandidate
);

/* =====================================================
   VILLAGE INTERESTS
===================================================== */

/**
 * @swagger
 * /api/recruitment/interest:
 *   post:
 *     summary: Link a candidate to one or more villages
 *     description: >
 *       `is_native` is derived server-side from the candidate's home village.
 *       A non-native lands in NATIVE_PRIORITY_WAIT unless a seat in that
 *       village has already been opened to waiting candidates.
 *     tags: [Recruitment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidateId, villages]
 *             properties:
 *               candidateId: { type: integer, example: 12 }
 *               villages:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Panjugula", "Amarapuram"]
 *     responses:
 *       201:
 *         description: Village interests linked successfully
 */
router.post("/recruitment/interest", verifyToken, recruitmentController.addInterests);

/**
 * @swagger
 * /api/recruitment/interest/{id}:
 *   delete:
 *     summary: Withdraw a candidate's interest in a village
 *     tags: [Recruitment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Village interest removed
 *       409:
 *         description: Interest is tied to an active selection
 */
router.delete("/recruitment/interest/:id", verifyToken, recruitmentController.removeInterest);

/* =====================================================
   VILLAGE POSITIONS
===================================================== */

/**
 * @swagger
 * /api/recruitment/position:
 *   get:
 *     summary: List village agent seats with derived vacancy
 *     description: >
 *       `required_agents` comes from the shared `required_agents_slabs` setting
 *       applied to the village's acreage; `deployed_agents` counts real agent
 *       rows; `vacancy` is the difference.
 *     tags: [Recruitment]
 *     responses:
 *       200:
 *         description: Village positions fetched successfully
 */
router.get("/recruitment/position", verifyToken, recruitmentController.listPositions);

/**
 * @swagger
 * /api/recruitment/position/sync:
 *   post:
 *     summary: Reconcile a village's seats against what its acreage requires
 *     tags: [Recruitment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [village]
 *             properties:
 *               village: { type: string, example: "Panjugula" }
 *               mandal: { type: string, example: "Kollapur" }
 *               district: { type: string, example: "Nagarkurnool" }
 *               state: { type: string, example: "Telangana" }
 *     responses:
 *       200:
 *         description: Village positions reconciled
 */
router.post("/recruitment/position/sync", verifyToken, recruitmentController.syncPositions);

/**
 * @swagger
 * /api/recruitment/position/{id}/open-to-waiting:
 *   put:
 *     summary: Release a seat to non-native candidates
 *     tags: [Recruitment]
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
 *               remarks: { type: string, example: "No native candidates after 60 days" }
 *     responses:
 *       200:
 *         description: Seat opened to waiting candidates
 *       409:
 *         description: Seat is not in an openable state
 */
router.put(
  "/recruitment/position/:id/open-to-waiting",
  verifyToken,
  recruitmentController.openPositionToWaiting
);

/**
 * @swagger
 * /api/recruitment/position/{id}/select:
 *   put:
 *     summary: Select a candidate for a seat
 *     description: >
 *       Rejects with 409 if a non-native candidate is selected for a seat still
 *       in NATIVE_SEARCH — the seat must be opened to waiting candidates first.
 *     tags: [Recruitment]
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
 *             required: [candidateId]
 *             properties:
 *               candidateId: { type: integer, example: 12 }
 *     responses:
 *       200:
 *         description: Candidate selected for seat
 *       409:
 *         description: Native-priority rule violation, or seat unavailable
 */
router.put(
  "/recruitment/position/:id/select",
  verifyToken,
  recruitmentController.selectCandidate
);

/* =====================================================
   STATS
===================================================== */

/**
 * @swagger
 * /api/recruitment/stats:
 *   get:
 *     summary: Pipeline, seat and interest counts for the dashboard
 *     tags: [Recruitment]
 *     responses:
 *       200:
 *         description: Recruitment stats fetched successfully
 */
router.get("/recruitment/stats", verifyToken, recruitmentController.getStats);

export default router;
