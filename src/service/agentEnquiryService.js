import { Op } from "sequelize";
import {
  Agent,
  AgentCandidate,
  AgentEnquiry,
  Employee,
} from "../model/associationModel.js";
import { TERMINAL_ENQUIRY_STATUSES } from "../model/agentEnquiryModel.js";

/* =====================================================
   HELPERS
===================================================== */

// Errors carry the HTTP status the controller should use, so a rule violation
// (409) is distinguishable from a bad request (400) or a missing row (404).
const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const norm = (value) => String(value || "").trim();

// Last 10 digits, so a number stored as +91XXXXXXXXXX still matches one
// typed as XXXXXXXXXX.
const phoneTail = (phone) => norm(phone).replace(/\D/g, "").slice(-10);

const formatCode = (id) => `ENQ-${String(id).padStart(6, "0")}`;

/**
 * Look for an existing agent or candidate on the caller's number, so the desk
 * sees who is ringing instead of opening a duplicate lead. Agents win over
 * candidates — an appointed agent is the more specific record.
 */
export const matchCallerByPhone = async (phone) => {
  const tail = phoneTail(phone);
  if (tail.length < 10) return null;

  const agent = await Agent.findOne({
    where: { phone: { [Op.like]: `%${tail}` } },
    attributes: ["id", "name", "phone", "village", "mandal", "district", "status"],
  });

  if (agent) {
    return {
      matched_record_type: "MASTER_AGENT",
      matched_record_id: agent.id,
      matched_record: agent,
    };
  }

  const candidate = await AgentCandidate.findOne({
    where: { phone: { [Op.like]: `%${tail}` } },
    attributes: ["id", "name", "phone", "village", "mandal", "district", "status"],
  });

  if (candidate) {
    return {
      matched_record_type: "AGENT_CANDIDATE",
      matched_record_id: candidate.id,
      matched_record: candidate,
    };
  }

  return null;
};

/* =====================================================
   ENQUIRIES
===================================================== */

export const listEnquiries = async (filters = {}) => {
  const {
    status,
    enquiryType,
    callerType,
    state,
    district,
    mandal,
    village,
    assignedEmployeeId,
    search,
    // "true" keeps only enquiries still being worked
    openOnly,
  } = filters;

  const where = {};

  if (status) where.status = status;
  if (enquiryType) where.enquiry_type = enquiryType;
  if (callerType) where.caller_type = callerType;
  if (state) where.state = state;
  if (district) where.district = district;
  if (mandal) where.mandal = mandal;
  if (village) where.village = village;
  if (assignedEmployeeId) where.assigned_employee_id = Number(assignedEmployeeId);

  if (String(openOnly) === "true") {
    where.status = { [Op.notIn]: TERMINAL_ENQUIRY_STATUSES };
  }

  if (search) {
    const term = `%${norm(search)}%`;
    where[Op.or] = [
      { caller_name: { [Op.iLike]: term } },
      { caller_phone: { [Op.iLike]: term } },
      { enquiry_code: { [Op.iLike]: term } },
      { village: { [Op.iLike]: term } },
    ];
  }

  return AgentEnquiry.findAll({
    where,
    include: [
      {
        model: Employee,
        as: "assignedEmployee",
        attributes: ["id", "name", "phone"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getEnquiryById = async (id) => {
  const enquiry = await AgentEnquiry.findByPk(id, {
    include: [
      {
        model: Employee,
        as: "assignedEmployee",
        attributes: ["id", "name", "phone"],
        required: false,
      },
      {
        model: AgentCandidate,
        as: "convertedCandidate",
        attributes: ["id", "name", "phone", "status"],
        required: false,
      },
    ],
  });

  if (!enquiry) throw httpError("Enquiry not found", 404);
  return enquiry;
};

export const createEnquiry = async (employeeId, payload = {}) => {
  const callerName = norm(payload.callerName ?? payload.caller_name);
  const callerPhone = norm(payload.callerPhone ?? payload.caller_phone);

  if (!callerName) throw httpError("Caller name is required");
  if (!callerPhone) throw httpError("Caller phone is required");

  // Attach whoever we already know on this number, so the desk is never
  // guessing whether this is a new person.
  const match = await matchCallerByPhone(callerPhone);

  const inferredCallerType =
    match?.matched_record_type === "MASTER_AGENT"
      ? "EXISTING_AGENT"
      : match
      ? "EXISTING_CANDIDATE"
      : "NEW_CANDIDATE";

  const enquiry = await AgentEnquiry.create({
    caller_name: callerName,
    caller_phone: callerPhone,
    caller_type: payload.callerType ?? payload.caller_type ?? inferredCallerType,
    enquiry_type: payload.enquiryType ?? payload.enquiry_type ?? "BECOME_AGENT",
    state: payload.state ?? null,
    district: payload.district ?? null,
    mandal: payload.mandal ?? null,
    village: payload.village ?? null,
    preferred_village: payload.preferredVillage ?? payload.preferred_village ?? null,
    status: payload.status ?? "NEW",
    notes: payload.notes ?? null,
    assigned_employee_id: payload.assignedEmployeeId ?? employeeId ?? null,
    matched_record_type: match?.matched_record_type ?? null,
    matched_record_id: match?.matched_record_id ?? null,
    callback_at: payload.callbackAt ?? payload.callback_at ?? null,
  });

  // The code embeds the generated id, so it can only be written post-insert.
  await enquiry.update({ enquiry_code: formatCode(enquiry.id) });

  return getEnquiryById(enquiry.id);
};

export const updateEnquiry = async (id, payload = {}) => {
  const enquiry = await AgentEnquiry.findByPk(id);
  if (!enquiry) throw httpError("Enquiry not found", 404);

  const updatable = {
    callerName: "caller_name",
    callerPhone: "caller_phone",
    callerType: "caller_type",
    enquiryType: "enquiry_type",
    state: "state",
    district: "district",
    mandal: "mandal",
    village: "village",
    preferredVillage: "preferred_village",
    notes: "notes",
    assignedEmployeeId: "assigned_employee_id",
    callbackAt: "callback_at",
  };

  const patch = {};
  for (const [key, column] of Object.entries(updatable)) {
    if (payload[key] !== undefined) patch[column] = payload[key];
    else if (payload[column] !== undefined) patch[column] = payload[column];
  }

  await enquiry.update(patch);
  return getEnquiryById(id);
};

/**
 * Moves an enquiry to a new status. Reaching a terminal status stamps
 * resolved_at so "time to resolution" stays answerable.
 */
export const updateEnquiryStatus = async (id, status, notes) => {
  const enquiry = await AgentEnquiry.findByPk(id);
  if (!enquiry) throw httpError("Enquiry not found", 404);
  if (!status) throw httpError("Status is required");

  const patch = { status };

  if (TERMINAL_ENQUIRY_STATUSES.includes(status)) {
    patch.resolved_at = new Date();
  } else {
    // Reopening clears the stamp so it never reports a stale resolution time.
    patch.resolved_at = null;
  }

  if (notes) {
    patch.notes = enquiry.notes ? `${enquiry.notes}\n\n${notes}` : notes;
  }

  await enquiry.update(patch);
  return getEnquiryById(id);
};

/**
 * Promotes an enquiry into the recruitment pipeline as a candidate. Idempotent:
 * calling it twice returns the candidate already created rather than making a
 * second one.
 */
export const convertEnquiryToCandidate = async (id, employeeId) => {
  const enquiry = await AgentEnquiry.findByPk(id);
  if (!enquiry) throw httpError("Enquiry not found", 404);

  if (enquiry.converted_candidate_id) {
    const existing = await AgentCandidate.findByPk(enquiry.converted_candidate_id);
    if (existing) return existing;
  }

  // An enquiry from somebody who is already an agent is a support call, not a
  // lead — converting it would create a candidate for a person already hired.
  if (enquiry.matched_record_type === "MASTER_AGENT") {
    throw httpError(
      "This caller is already an appointed agent; convert is not applicable.",
      409
    );
  }

  const tail = phoneTail(enquiry.caller_phone);
  const duplicate = tail
    ? await AgentCandidate.findOne({ where: { phone: { [Op.like]: `%${tail}` } } })
    : null;

  const candidate =
    duplicate ??
    (await AgentCandidate.create({
      name: enquiry.caller_name,
      phone: enquiry.caller_phone,
      state: enquiry.state,
      district: enquiry.district,
      mandal: enquiry.mandal,
      village: enquiry.village,
      status: "NEW_LEAD",
      lead_source: "INBOUND_ENQUIRY",
      created_by: employeeId ?? null,
      notes: enquiry.notes,
    }));

  await enquiry.update({
    converted_candidate_id: candidate.id,
    status: "CONVERTED_TO_LEAD",
    resolved_at: new Date(),
    matched_record_type: "AGENT_CANDIDATE",
    matched_record_id: candidate.id,
  });

  return candidate;
};

export const deleteEnquiry = async (id) => {
  const enquiry = await AgentEnquiry.findByPk(id);
  if (!enquiry) throw httpError("Enquiry not found", 404);
  await enquiry.destroy();
  return { id: Number(id) };
};

/* =====================================================
   STATS
===================================================== */

export const getEnquiryStats = async () => {
  const rows = await AgentEnquiry.findAll({
    attributes: ["status", "enquiry_type", "caller_type"],
    raw: true,
  });

  const tally = (key) =>
    rows.reduce((acc, row) => {
      const value = row[key] || "UNKNOWN";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

  const open = rows.filter(
    (row) => !TERMINAL_ENQUIRY_STATUSES.includes(row.status)
  ).length;

  return {
    total: rows.length,
    open,
    resolved: rows.length - open,
    byStatus: tally("status"),
    byEnquiryType: tally("enquiry_type"),
    byCallerType: tally("caller_type"),
  };
};
