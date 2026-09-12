import * as agentLeadService from "../service/agentLeadService.js";
import * as agentOnboardingService from "../service/agentOnboardingService.js";

// Rule violations carry their own status (409) from the service; anything
// without one is treated as a bad request.
const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.statusCode || fallbackStatus).json({ message: error.message });

/* ── Lead queues ──────────────────────────────────────────────── */

export const listLeads = async (req, res) => {
  try {
    const result = await agentLeadService.listLeads(req.query);
    return res
      .status(200)
      .json({ message: "Leads fetched successfully", count: result.length, result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getLead = async (req, res) => {
  try {
    const result = await agentLeadService.getLeadById(req.params.id);
    return res.status(200).json({ message: "Lead fetched successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const getQueueCounts = async (req, res) => {
  try {
    const result = await agentLeadService.getQueueCounts();
    return res.status(200).json({ message: "Queue counts fetched", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

/* ── Allotment ────────────────────────────────────────────────── */

export const allotLeads = async (req, res) => {
  try {
    const result = await agentLeadService.allotLeads(req.body);
    return res
      .status(200)
      .json({ message: `${result.allotted} lead(s) allotted`, result });
  } catch (error) {
    return fail(res, error);
  }
};

export const unallotLeads = async (req, res) => {
  try {
    const result = await agentLeadService.unallotLeads(req.body);
    return res
      .status(200)
      .json({ message: `${result.unallotted} lead(s) returned to the pool`, result });
  } catch (error) {
    return fail(res, error);
  }
};

/* ── Calls ────────────────────────────────────────────────────── */

export const logCallAttempt = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentLeadService.logCallAttempt(employeeId, req.body);
    return res.status(201).json({ message: "Call attempt recorded", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const listCallAttempts = async (req, res) => {
  try {
    const result = await agentLeadService.listCallAttempts(req.query);
    return res
      .status(200)
      .json({ message: "Call attempts fetched", count: result.length, result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

/* ── Team leader escalation ───────────────────────────────────── */

export const escalateLead = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentLeadService.escalateLead(employeeId, req.body);
    return res.status(201).json({ message: "Lead escalated to team leader", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const listEscalations = async (req, res) => {
  try {
    const result = await agentLeadService.listEscalations(req.query);
    return res
      .status(200)
      .json({ message: "Escalations fetched", count: result.length, result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const resolveEscalation = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentLeadService.resolveEscalation(
      req.params.id,
      employeeId,
      req.body
    );
    return res.status(200).json({ message: "Escalation resolved", result });
  } catch (error) {
    return fail(res, error);
  }
};

/* ── Office visits ────────────────────────────────────────────── */

export const listOfficeVisits = async (req, res) => {
  try {
    const result = await agentLeadService.listOfficeVisits(req.query);
    return res
      .status(200)
      .json({ message: "Office visits fetched", count: result.length, result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const scheduleOfficeVisit = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentLeadService.scheduleOfficeVisit(employeeId, req.body);
    return res.status(201).json({ message: "Office visit scheduled", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateOfficeVisitStatus = async (req, res) => {
  try {
    const result = await agentLeadService.updateOfficeVisitStatus(
      req.params.id,
      req.body
    );
    return res.status(200).json({ message: "Office visit updated", result });
  } catch (error) {
    return fail(res, error);
  }
};

/* ── Onboarding ───────────────────────────────────────────────── */

export const onboardCandidate = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentOnboardingService.onboardCandidate(employeeId, req.body);
    return res.status(result.alreadyOnboarded ? 200 : 201).json({
      message: result.alreadyOnboarded
        ? "This candidate is already an agent"
        : "Agent onboarded successfully",
      result,
    });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateAgentPaperwork = async (req, res) => {
  try {
    const result = await agentOnboardingService.updateAgentPaperwork(
      req.params.agentId,
      req.body
    );
    return res.status(200).json({ message: "Paperwork updated", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const getOnboardingSummary = async (req, res) => {
  try {
    const result = await agentOnboardingService.getOnboardingSummary(req.params.agentId);
    return res.status(200).json({ message: "Onboarding summary fetched", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

/* ── Reporting ────────────────────────────────────────────────── */

export const getTelecallerPerformance = async (req, res) => {
  try {
    const result = await agentLeadService.getTelecallerPerformance(req.query);
    return res.status(200).json({ message: "Telecaller performance fetched", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getLeadSourceBreakdown = async (req, res) => {
  try {
    const result = await agentLeadService.getLeadSourceBreakdown();
    return res.status(200).json({ message: "Lead source breakdown fetched", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};
