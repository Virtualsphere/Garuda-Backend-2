import * as recruitmentService from "../service/recruitmentService.js";

// Rule violations carry their own status (409) from the service; anything
// without one is treated as a bad request.
const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.statusCode || fallbackStatus).json({ message: error.message });

/* =====================================================
   CANDIDATES
===================================================== */

export const listCandidates = async (req, res) => {
  try {
    const result = await recruitmentService.listCandidates(req.query);
    return res.status(200).json({
      message: "Candidates fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getCandidate = async (req, res) => {
  try {
    const result = await recruitmentService.getCandidateById(req.params.id);
    return res.status(200).json({ message: "Candidate fetched successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const createCandidate = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });

    const result = await recruitmentService.createCandidate(employeeId, req.body);
    return res.status(201).json({ message: "Candidate created successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const result = await recruitmentService.updateCandidate(req.params.id, req.body);
    return res.status(200).json({ message: "Candidate updated successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const updateCandidateStatus = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const { status, notes } = req.body;

    const result = await recruitmentService.transitionCandidateStatus(
      req.params.id,
      status,
      employeeId,
      notes
    );
    return res.status(200).json({ message: "Candidate status updated successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const convertCandidate = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });

    const result = await recruitmentService.convertCandidateToAgent(req.params.id, employeeId);
    return res.status(201).json({ message: "Candidate appointed as agent", result });
  } catch (error) {
    return fail(res, error);
  }
};

/* =====================================================
   VILLAGE INTERESTS
===================================================== */

export const addInterests = async (req, res) => {
  try {
    const { candidateId, villages } = req.body;

    const result = await recruitmentService.addCandidateInterests(candidateId, villages);
    return res.status(201).json({
      message: "Village interests linked successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error);
  }
};

export const removeInterest = async (req, res) => {
  try {
    const result = await recruitmentService.removeCandidateInterest(req.params.id);
    return res.status(200).json({ message: "Village interest removed", result });
  } catch (error) {
    return fail(res, error);
  }
};

/* =====================================================
   VILLAGE POSITIONS
===================================================== */

export const listPositions = async (req, res) => {
  try {
    const result = await recruitmentService.listPositions(req.query);
    return res.status(200).json({
      message: "Village positions fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const syncPositions = async (req, res) => {
  try {
    const result = await recruitmentService.syncVillagePositions(req.body);
    return res.status(200).json({ message: "Village positions reconciled", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const openPositionToWaiting = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const { remarks } = req.body;

    const result = await recruitmentService.openPositionToWaiting(
      req.params.id,
      employeeId,
      remarks
    );
    return res.status(200).json({ message: "Seat opened to waiting candidates", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const selectCandidate = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const { candidateId } = req.body;

    const result = await recruitmentService.selectCandidateForPosition(
      req.params.id,
      candidateId,
      employeeId
    );
    return res.status(200).json({ message: "Candidate selected for seat", result });
  } catch (error) {
    return fail(res, error);
  }
};

/* =====================================================
   STATS
===================================================== */

export const getStats = async (req, res) => {
  try {
    const result = await recruitmentService.getRecruitmentStats();
    return res.status(200).json({ message: "Recruitment stats fetched successfully", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};
