import { Op, fn, col, literal } from "sequelize";
import sequelize from "../db/db.js";
import {
  Agent,
  AgentCandidate,
  AgentCallAttempt,
  AgentLeadEscalation,
  AgentLeadWhatsapp,
  AgentOfficeVisit,
  CandidateStatusHistory,
  CandidateVillageInterest,
  Employee,
} from "../model/associationModel.js";
import { TERMINAL_CANDIDATE_STATUSES } from "../model/agentCandidateModel.js";

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

const today = () => new Date().toISOString().slice(0, 10);

const asArray = (value) =>
  Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];

/**
 * The people attached to a lead row, loaded the same way everywhere so every
 * queue renders identical cards.
 */
const LEAD_INCLUDES = [
  {
    model: Employee,
    as: "assignedTelecaller",
    attributes: ["id", "name", "phone"],
    required: false,
  },
  {
    model: Employee,
    as: "assignedTeamLeader",
    attributes: ["id", "name", "phone"],
    required: false,
  },
  {
    model: Agent,
    as: "referringAgent",
    attributes: ["id", "name", "phone", "village", "mandal", "district", "state"],
    required: false,
  },
  {
    model: CandidateVillageInterest,
    as: "interests",
    required: false,
  },
];

/**
 * A lead is only workable while it is still in play. Every queue below starts
 * from this so a rejected or joined candidate never resurfaces in a call list.
 */
const activeLeadWhere = () => ({
  status: { [Op.notIn]: [...TERMINAL_CANDIDATE_STATUSES, "JOINED"] },
});

/* ── Interested ───────────────────────────────────────────────── */

/**
 * Stages that mean "said yes, not yet an agent" — the Interested tab and its
 * badge. Must match INTERESTED_STAGES in the admin's recruitmentModel.js.
 */
const INTERESTED_STAGES = ["INTERESTED", "VILLAGE_INTEREST", "SELECTED", "OFFICE_VISIT"];

/** Stages at or past "interested" that a later Proceed must not pull back. */
const AT_OR_PAST_INTERESTED = [...INTERESTED_STAGES, "WAITING", "JOINING_PROCESS"];

/**
 * What a Proceed does to a candidate's stage: promote anyone earlier to
 * INTERESTED, but leave a candidate who has already moved on (an office visit
 * booked, selected for a seat) where they are. Re-calling an interested
 * candidate and pressing Proceed again is routine and must not demote them.
 */
const interestedStatusFor = (current) =>
  AT_OR_PAST_INTERESTED.includes(current) ? current : "INTERESTED";

/* ── Recovery hub (Not Lifted & Invalid) ──────────────────────── */

/** The last-dial outcomes that put a lead in the recovery hub. */
const RECOVERY_CALL_STATUSES = ["Not Lifted", "No Answer", "Invalid Number"];

/**
 * Statuses that take a lead out of recovery for good. NOT_ELIGIBLE is
 * deliberately missing: an "Invalid Number" dial closes the lead on the calling
 * desk, but the recovery hub's job is to find a working number for exactly
 * those leads, so they stay in its pool until dumped or reached.
 */
const RECOVERY_CLOSED_STATUSES = TERMINAL_CANDIDATE_STATUSES.filter(
  (s) => s !== "NOT_ELIGIBLE"
).concat("JOINED");

const recoveryWhere = () => ({
  last_call_status: { [Op.in]: RECOVERY_CALL_STATUSES },
  status: { [Op.notIn]: RECOVERY_CLOSED_STATUSES },
});

const DUMPED_STATUS = "NOT_RESPONDING";

const WHATSAPP_TRAIL_INCLUDE = {
  model: AgentLeadWhatsapp,
  as: "whatsappTrail",
  required: false,
  separate: true,
  include: [{ model: Employee, as: "sender", attributes: ["id", "name"], required: false }],
  order: [["sent_at", "DESC"]],
};

/**
 * Who a dial or a recovery action is credited to. The recovery hub runs on a
 * shared login, so it names the specialist at the keyboard; every other desk
 * is one person per login and the token is the truth.
 */
const creditedEmployee = (employeeId, callerEmployeeId) =>
  callerEmployeeId ? Number(callerEmployeeId) : employeeId ?? null;

/* =====================================================
   LEAD QUEUES
===================================================== */

export const QUEUE_KEYS = ["unallotted", "first-call", "follow-up", "not-lifted"];

/**
 * The queues are NOT mutually exclusive, deliberately: a lead that was never
 * lifted and has a call-back booked belongs in both, and the desk expects to
 * find it in either. The Calls badge therefore sums three overlapping sets,
 * which is what the operators count.
 */
const queueWhere = (queue) => {
  switch (queue) {
    // Level 1: not yet attached to a squad. This is team attachment, not
    // telecaller allotment — a lead can have a squad but no caller.
    case "unallotted":
      return { assigned_team_id: { [Op.is]: null } };

    // Never dialled, whether or not anyone owns it yet.
    case "first-call":
      return {
        [Op.or]: [{ call_attempts: { [Op.is]: null } }, { call_attempts: 0 }],
      };

    // A call-back is booked. The tab filters today / tomorrow / all on top.
    case "follow-up":
      return { follow_up_date: { [Op.not]: null } };

    // Dialled and nobody picked up.
    case "not-lifted":
      return { last_call_status: { [Op.in]: ["Not Lifted", "No Answer"] } };

    default:
      return {};
  }
};

export const listLeads = async (filters = {}) => {
  const {
    queue,
    status,
    state,
    district,
    mandal,
    village,
    assignedEmployeeId,
    teamLeaderId,
    source,
    search,
    activeOnly = "true",
  } = filters;

  const where = {};

  // `pool` swaps the base set: the recovery hub's open list, or its dumped
  // archive. Both reach past the active-only default — invalid-number leads are
  // NOT_ELIGIBLE and dumped ones NOT_RESPONDING, which that default hides.
  const pool = filters.pool;
  if (pool === "recovery") {
    Object.assign(where, recoveryWhere());
  } else if (pool === "dumped") {
    where.status = DUMPED_STATUS;
  } else if (String(activeOnly) !== "false") {
    Object.assign(where, activeLeadWhere());
  }
  if (queue) Object.assign(where, queueWhere(queue));

  if (status) where.status = status;
  if (state) where.state = state;
  if (district) where.district = district;
  if (mandal) where.mandal = mandal;
  if (village) where.village = village;
  if (source) where.lead_source = source;
  if (assignedEmployeeId) where.assigned_employee_id = Number(assignedEmployeeId);
  if (teamLeaderId) where.team_leader_id = Number(teamLeaderId);
  if (filters.teamId) where.assigned_team_id = Number(filters.teamId);

  // Within a squad, "unallotted" means nobody has been given the dial yet.
  if (filters.callerAllotment === "unallotted") {
    where.assigned_employee_id = { [Op.is]: null };
  } else if (filters.callerAllotment === "allotted") {
    where.assigned_employee_id = { [Op.not]: null };
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
      { village: { [Op.iLike]: term } },
      { mandal: { [Op.iLike]: term } },
    ];
  }

  const include =
    String(filters.includeWhatsapp) === "true"
      ? [...LEAD_INCLUDES, WHATSAPP_TRAIL_INCLUDE]
      : LEAD_INCLUDES;

  // The archive reads newest-dump first; the recovery queue oldest-dial first,
  // so the lead waiting longest for a retry is at the top.
  const order =
    pool === "dumped"
      ? [["dumped_at", "DESC NULLS LAST"]]
      : pool === "recovery"
      ? [["last_attempt_at", "ASC NULLS LAST"]]
      : [
          ["follow_up_date", "ASC NULLS LAST"],
          ["created_at", "DESC"],
        ];

  return AgentCandidate.findAll({ where, include, order });
};

/**
 * Counts for the tab badges. Computed in one pass over the active leads rather
 * than four COUNT queries, because the queues overlap in their predicates and
 * must be evaluated against the same snapshot.
 */
export const getQueueCounts = async () => {
  const rows = await AgentCandidate.findAll({
    where: activeLeadWhere(),
    attributes: [
      "id",
      "assigned_team_id",
      "assigned_employee_id",
      "call_attempts",
      "last_call_status",
      "follow_up_date",
      "status",
    ],
    raw: true,
  });

  const counts = {
    total: rows.length,
    unallotted: 0,
    "first-call": 0,
    "follow-up": 0,
    "not-lifted": 0,
    // How many already have a squad but nobody to dial them — the number the
    // Allot Leads workspace is actually working through.
    awaitingCaller: 0,
  };

  rows.forEach((row) => {
    const attempts = Number(row.call_attempts) || 0;

    if (!row.assigned_team_id) counts.unallotted += 1;
    if (row.assigned_team_id && !row.assigned_employee_id) counts.awaitingCaller += 1;
    if (attempts === 0) counts["first-call"] += 1;
    if (row.follow_up_date) counts["follow-up"] += 1;
    if (["Not Lifted", "No Answer"].includes(row.last_call_status)) {
      counts["not-lifted"] += 1;
    }
  });

  // Counted separately: the recovery pool includes NOT_ELIGIBLE leads, which the
  // active snapshot above leaves out.
  const [recovery, pendingEscalations, interests, officeVisits] = await Promise.all([
    AgentCandidate.count({ where: recoveryWhere() }),
    AgentLeadEscalation.count({ where: { status: "Pending" } }),
    AgentCandidate.count({
      where: { status: { [Op.in]: INTERESTED_STAGES } },
    }),
    AgentOfficeVisit.count({ where: { status: "Scheduled" } }),
  ]);

  counts["not-lifted-invalid"] = recovery;
  counts["team-leader"] = pendingEscalations;
  counts.interested = interests;
  counts.onboarding = officeVisits;

  return counts;
};

/* =====================================================
   INTERESTED
===================================================== */

/** The newest row per candidate, from rows already sorted newest-first. */
const latestByCandidate = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.candidate_id)) map.set(row.candidate_id, row);
  });
  return map;
};

/**
 * Candidates who said yes and are not yet agents, each with what the
 * Interested tab shows beside them:
 *
 *   proceedAttempt  the latest call marked Proceed — who closed it, when, and
 *                   the recording
 *   escalation      the latest team-leader escalation, if one was ever raised
 *   scheduledVisit  the office visit currently booked, if any
 *
 * Fetched as one lead query plus three batched lookups rather than a join per
 * row, and attached as plain keys so the response stays one flat list.
 */
export const listInterested = async () => {
  const leads = await AgentCandidate.findAll({
    where: { status: { [Op.in]: INTERESTED_STAGES } },
    include: LEAD_INCLUDES,
    order: [["updated_at", "DESC"]],
  });

  const ids = leads.map((l) => l.id);
  if (!ids.length) return [];

  const [attempts, escalations, visits] = await Promise.all([
    AgentCallAttempt.findAll({
      where: { candidate_id: { [Op.in]: ids }, result: "Proceed" },
      include: [{ model: Employee, as: "employee", attributes: ["id", "name"], required: false }],
      order: [["called_at", "DESC"]],
    }),
    AgentLeadEscalation.findAll({
      where: { candidate_id: { [Op.in]: ids } },
      include: [
        { model: Employee, as: "telecaller", attributes: ["id", "name"], required: false },
        { model: Employee, as: "teamLeader", attributes: ["id", "name"], required: false },
      ],
      order: [["forwarded_at", "DESC"]],
    }),
    AgentOfficeVisit.findAll({
      where: { candidate_id: { [Op.in]: ids }, status: "Scheduled" },
      include: [
        { model: Employee, as: "assignedEmployee", attributes: ["id", "name"], required: false },
      ],
      order: [["visit_date", "DESC"]],
    }),
  ]);

  const proceedBy = latestByCandidate(attempts);
  const escalationBy = latestByCandidate(escalations);
  const visitBy = latestByCandidate(visits);

  return leads.map((lead) => ({
    ...lead.toJSON(),
    proceedAttempt: proceedBy.get(lead.id) || null,
    escalation: escalationBy.get(lead.id) || null,
    scheduledVisit: visitBy.get(lead.id) || null,
  }));
};

/* =====================================================
   ALLOTMENT
===================================================== */

/**
 * Hand a batch of leads to a telecaller. Idempotent per lead — re-allotting an
 * already-allotted lead reassigns it and re-stamps `allotted_at`, which is what
 * the desk means by "move these to someone else".
 */
export const allotLeads = async ({
  leadIds,
  employeeId,
  teamLeaderId,
  teamId,
  teamName,
}) => {
  const ids = asArray(leadIds).map(Number).filter(Boolean);
  if (!ids.length) throw httpError("At least one lead is required");
  if (!employeeId && !teamId) {
    throw httpError("A squad or a telecaller is required");
  }

  // Level 1 attaches a lead to a squad with no caller yet; Level 2 gives it to
  // one. Both go through here, so the telecaller is optional.
  if (employeeId) {
    const telecaller = await Employee.findByPk(employeeId);
    if (!telecaller) throw httpError("Telecaller not found", 404);
  }

  const [affected] = await AgentCandidate.update(
    {
      assigned_employee_id: employeeId ? Number(employeeId) : null,
      team_leader_id: teamLeaderId ? Number(teamLeaderId) : null,
      assigned_team_id: teamId ? Number(teamId) : null,
      assigned_team_name: teamName || null,
      allotted_at: new Date(),
    },
    { where: { id: { [Op.in]: ids } } }
  );

  return {
    allotted: Number(affected) || 0,
    leadIds: ids,
    employeeId: employeeId ? Number(employeeId) : null,
    teamId: teamId ? Number(teamId) : null,
  };
};

/** Take a lead back off a telecaller, returning it to the unallotted queue. */
export const unallotLeads = async ({ leadIds }) => {
  const ids = asArray(leadIds).map(Number).filter(Boolean);
  if (!ids.length) throw httpError("At least one lead is required");

  const [affected] = await AgentCandidate.update(
    {
      assigned_employee_id: null,
      assigned_team_id: null,
      assigned_team_name: null,
      allotted_at: null,
    },
    { where: { id: { [Op.in]: ids } } }
  );

  return { unallotted: Number(affected) || 0, leadIds: ids };
};

/* =====================================================
   CALL ATTEMPTS
===================================================== */

/**
 * Record a dial. Writes the attempt to the history table and folds the outcome
 * onto the lead so every queue can be evaluated without a join.
 *
 * The result drives the lead's own status: "Proceed" promotes it to INTERESTED,
 * "Not Interested" closes it, "Follow Up" schedules the call-back.
 */
export const logCallAttempt = async (employeeId, payload = {}) => {
  const candidateId = payload.leadId ?? payload.candidateId ?? payload.candidate_id;
  const answerStatus = payload.answerStatus ?? payload.answer_status;

  if (!candidateId) throw httpError("A lead is required");
  if (!answerStatus) throw httpError("An answer status is required");

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Lead not found", 404);

  const followUpDate = payload.followUpDate ?? payload.follow_up_date;

  // Validate before writing anything. Creating the attempt first would leave a
  // phantom row in the history — and the lead's counter out of step with it —
  // every time a caller picked "Follow Up" without giving a date.
  if (payload.result === "Follow Up" && !followUpDate) {
    throw httpError("A follow-up needs a date to call back on");
  }

  // Diverting without saying where is the same mistake as a follow-up with no
  // date: it reads as handled while nobody has actually been given the lead.
  if (payload.result === "Divert" && !payload.divertToDepartment) {
    throw httpError("Diverting a lead needs the department it is going to");
  }

  const queue = payload.queue ?? "first-call";

  // Only the recovery hub may credit the dial to a colleague; anywhere else the
  // field is ignored and the logged-in employee made the call.
  const dialler =
    queue === "recovery" ? creditedEmployee(employeeId, payload.callerEmployeeId) : employeeId ?? null;

  const attempt = await AgentCallAttempt.create({
    candidate_id: Number(candidateId),
    queue,
    answer_status: answerStatus,
    result: payload.result ?? null,
    note: payload.note ?? null,
    recording_url: payload.recordingUrl ?? payload.recording_url ?? null,
    duration_seconds: payload.durationSeconds ?? payload.duration_seconds ?? null,
    employee_id: dialler,
    called_at: new Date(),
  });

  const patch = {
    call_attempts: (Number(candidate.call_attempts) || 0) + 1,
    last_call_status: answerStatus,
    last_call_note: payload.note ?? candidate.last_call_note,
    last_attempt_at: new Date(),
    last_attempt_by: dialler,
    call_status: answerStatus,
  };

  if (payload.result === "Follow Up") {
    patch.follow_up_date = followUpDate;
    patch.follow_up_time = payload.followUpTime ?? payload.follow_up_time ?? null;
    patch.follow_up_by = dialler;
  } else if (followUpDate) {
    patch.follow_up_date = followUpDate;
    patch.follow_up_time = payload.followUpTime ?? payload.follow_up_time ?? null;
    patch.follow_up_by = dialler;
  } else {
    // Anything other than a fresh call-back clears the old promise, so the
    // lead cannot sit in the follow-up queue after being dealt with.
    patch.follow_up_date = null;
    patch.follow_up_time = null;
  }

  if (payload.result === "Proceed") {
    patch.status = interestedStatusFor(candidate.status);
  } else if (payload.result === "Not Interested") {
    patch.status = "NOT_INTERESTED";
  } else if (payload.result === "Divert") {
    // The agents desk is done with them; the receiving department picks them
    // up from their own queue, so the candidate is terminal *here*.
    patch.status = "DIVERTED";
    patch.diverted_to_department = payload.divertToDepartment;
    patch.diverted_at = new Date();
    patch.diverted_by = dialler;
  } else if (answerStatus === "Invalid Number") {
    patch.status = "NOT_ELIGIBLE";
  } else if (candidate.status === "NEW_LEAD") {
    patch.status = "FIRST_CALL";
  } else if (candidate.status === "NOT_ELIGIBLE") {
    // An invalid-number lead the recovery hub has since got through to (or at
    // least got ringing) has a working number again — back on the desk.
    patch.status = "FIRST_CALL";
  }

  await candidate.update(patch);

  return { attempt, lead: await getLeadById(candidateId) };
};

export const listCallAttempts = async (filters = {}) => {
  const where = {};
  if (filters.candidateId) where.candidate_id = Number(filters.candidateId);
  if (filters.employeeId) where.employee_id = Number(filters.employeeId);
  if (filters.answerStatus) where.answer_status = filters.answerStatus;
  if (filters.queue) where.queue = filters.queue;

  return AgentCallAttempt.findAll({
    where,
    include: [
      { model: Employee, as: "employee", attributes: ["id", "name"], required: false },
      {
        model: AgentCandidate,
        as: "candidate",
        attributes: ["id", "name", "phone", "village", "mandal"],
        required: false,
      },
    ],
    order: [["called_at", "DESC"]],
  });
};

export const getLeadById = async (id) => {
  const lead = await AgentCandidate.findByPk(id, {
    include: [
      ...LEAD_INCLUDES,
      {
        model: AgentCallAttempt,
        as: "callAttempts",
        required: false,
        separate: true,
        order: [["called_at", "DESC"]],
      },
      {
        model: AgentLeadEscalation,
        as: "escalations",
        required: false,
        separate: true,
        order: [["forwarded_at", "DESC"]],
      },
      {
        model: AgentOfficeVisit,
        as: "officeVisits",
        required: false,
        separate: true,
        order: [["visit_date", "DESC"]],
      },
      WHATSAPP_TRAIL_INCLUDE,
    ],
  });

  if (!lead) throw httpError("Lead not found", 404);
  return lead;
};

/* =====================================================
   WHATSAPP TRAIL
===================================================== */

/**
 * Record a WhatsApp message the caller has just opened in their browser. The
 * desk sends through wa.me, so this is a log of intent, not a delivery receipt.
 *
 * `callerEmployeeId` credits a colleague at a shared desk (the recovery hub);
 * otherwise the message is the logged-in employee's.
 */
export const logWhatsapp = async (employeeId, candidateId, payload = {}) => {
  const messageText = String(payload.messageText ?? payload.message_text ?? "").trim();
  if (!messageText) throw httpError("A message is required");

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Lead not found", 404);

  const sentBy = payload.callerEmployeeId ? Number(payload.callerEmployeeId) : employeeId ?? null;

  const message = await AgentLeadWhatsapp.create({
    candidate_id: Number(candidateId),
    template_name: payload.templateName ?? payload.template_name ?? null,
    message_text: messageText,
    sent_by: sentBy,
    sent_at: new Date(),
  });

  return AgentLeadWhatsapp.findByPk(message.id, {
    include: [{ model: Employee, as: "sender", attributes: ["id", "name"], required: false }],
  });
};

/* =====================================================
   RECOVERY HUB — PHONE FIX / DUMP / RESTORE
===================================================== */

/** A 10-digit Indian mobile, tolerating a +91 / 0 prefix and punctuation. */
const normaliseMobile = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

/**
 * Correct a lead's phone number. The lead deliberately stays where it is —
 * still "Invalid Number" or "Not Lifted" in the recovery pool — until a call
 * on the new number actually connects; a corrected number is a hope, not proof.
 */
export const updateLeadPhone = async (employeeId, candidateId, payload = {}) => {
  const phone = normaliseMobile(payload.phone);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw httpError("Enter a valid 10-digit mobile number");
  }

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Lead not found", 404);

  const previous = candidate.phone;
  if (normaliseMobile(previous) === phone) {
    throw httpError("That is already the lead's number");
  }

  const note = String(payload.note ?? "").trim() || `Phone number updated to ${phone}`;

  await sequelize.transaction(async (transaction) => {
    await candidate.update({ phone, last_call_note: note }, { transaction });
    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: candidate.status,
        to_status: candidate.status,
        employee_id: creditedEmployee(employeeId, payload.callerEmployeeId),
        notes: `Phone changed from ${previous || "—"} to ${phone}. ${note}`,
      },
      { transaction }
    );
  });

  return getLeadById(candidateId);
};

/**
 * Give up on an unreachable lead. Moves it to NOT_RESPONDING (the dumped
 * archive) and remembers the status it had, so a restore is exact.
 */
export const dumpLead = async (employeeId, candidateId, payload = {}) => {
  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Lead not found", 404);

  if (candidate.status === DUMPED_STATUS) {
    throw httpError("This lead is already in the dumped archive", 409);
  }
  if (RECOVERY_CLOSED_STATUSES.includes(candidate.status)) {
    throw httpError(
      `This lead is already closed (${candidate.status}); only open leads can be dumped`,
      409
    );
  }

  const reason = String(payload.reason ?? "").trim() || "No response after repeated attempts";
  const dumpedBy = creditedEmployee(employeeId, payload.callerEmployeeId);
  const fromStatus = candidate.status;

  await sequelize.transaction(async (transaction) => {
    await candidate.update(
      {
        status_before_dump: fromStatus,
        status: DUMPED_STATUS,
        dumped_at: new Date(),
        dumped_by: dumpedBy,
        dump_reason: reason,
        // A dumped lead must not keep surfacing in the follow-up queue.
        follow_up_date: null,
        follow_up_time: null,
      },
      { transaction }
    );
    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: fromStatus,
        to_status: DUMPED_STATUS,
        employee_id: dumpedBy,
        notes: `Dumped: ${reason}`,
      },
      { transaction }
    );
  });

  return getLeadById(candidateId);
};

/** Bring a dumped lead back to the status it had before, and so back into recovery. */
export const restoreLead = async (employeeId, candidateId) => {
  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Lead not found", 404);

  if (candidate.status !== DUMPED_STATUS) {
    throw httpError("Only a dumped lead can be restored", 409);
  }

  const restoredTo = candidate.status_before_dump || "FIRST_CALL";

  await sequelize.transaction(async (transaction) => {
    await candidate.update(
      {
        status: restoredTo,
        status_before_dump: null,
        dumped_at: null,
        dumped_by: null,
        dump_reason: null,
      },
      { transaction }
    );
    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: DUMPED_STATUS,
        to_status: restoredTo,
        employee_id: employeeId ?? null,
        notes: "Restored from the dumped archive",
      },
      { transaction }
    );
  });

  return getLeadById(candidateId);
};

/* =====================================================
   TEAM LEADER ESCALATION
===================================================== */

/**
 * A telecaller hands the lead up. Refuses a second open escalation on the same
 * lead — two team leaders working one candidate is the confusion this queue
 * exists to prevent.
 */
export const escalateLead = async (employeeId, payload = {}) => {
  const candidateId = payload.leadId ?? payload.candidateId;
  if (!candidateId) throw httpError("A lead is required");

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Lead not found", 404);

  const open = await AgentLeadEscalation.findOne({
    where: { candidate_id: Number(candidateId), status: "Pending" },
  });
  if (open) {
    throw httpError(
      "This lead is already with a team leader; resolve that escalation first.",
      409
    );
  }

  const escalation = await AgentLeadEscalation.create({
    candidate_id: Number(candidateId),
    telecaller_id: employeeId ?? null,
    telecaller_note: payload.note ?? payload.telecallerNote ?? null,
    call_recording_url: payload.recordingUrl ?? null,
    call_duration: payload.callDuration ?? null,
    call_datetime: payload.callDateTime ?? new Date(),
    team_leader_id:
      payload.teamLeaderId ?? candidate.team_leader_id ?? null,
    status: "Pending",
  });

  return getEscalationById(escalation.id);
};

export const listEscalations = async (filters = {}) => {
  const where = {};
  if (filters.id) where.id = Number(filters.id);
  if (filters.status && filters.status !== "All") where.status = filters.status;
  if (filters.teamLeaderId) where.team_leader_id = Number(filters.teamLeaderId);
  if (filters.candidateId) where.candidate_id = Number(filters.candidateId);

  return AgentLeadEscalation.findAll({
    where,
    include: [
      {
        model: AgentCandidate,
        as: "candidate",
        required: false,
        include: LEAD_INCLUDES,
      },
      { model: Employee, as: "telecaller", attributes: ["id", "name", "phone"], required: false },
      { model: Employee, as: "teamLeader", attributes: ["id", "name", "phone"], required: false },
      { model: Employee, as: "resolver", attributes: ["id", "name"], required: false },
    ],
    order: [["forwarded_at", "DESC"]],
  });
};

export const getEscalationById = async (id) => {
  const [found] = await listEscalations({ id });
  if (!found) throw httpError("Escalation not found", 404);
  return found;
};

/**
 * The team leader closes the case — either resolving it themselves or handing
 * it back to the telecaller with a note.
 *
 * The case and the candidate change together in one transaction, so a closed
 * escalation can never leave its candidate behind in the old state.
 */
export const resolveEscalation = async (id, employeeId, payload = {}) => {
  const escalation = await AgentLeadEscalation.findByPk(id);
  if (!escalation) throw httpError("Escalation not found", 404);

  const status = payload.status;
  if (!["Completed", "ReturnedToTelecaller"].includes(status)) {
    throw httpError("Status must be Completed or ReturnedToTelecaller");
  }

  // Resolving twice would silently rewrite the outcome and its timestamp.
  if (escalation.status !== "Pending") {
    throw httpError(`This escalation is already ${escalation.status}`, 409);
  }

  const tlResult = payload.tlResult ?? payload.result ?? null;
  const tlNote = payload.tlNote ?? payload.note ?? null;

  await sequelize.transaction(async (transaction) => {
    await escalation.update(
      {
        status,
        tl_note: tlNote ?? escalation.tl_note,
        tl_recording_url: payload.tlRecordingUrl ?? escalation.tl_recording_url,
        tl_result: tlResult,
        // Credit stays with the leader it was forwarded to; whoever clicked is
        // recorded separately. An unassigned case is claimed by its resolver.
        team_leader_id: escalation.team_leader_id ?? employeeId ?? null,
        resolved_by: employeeId ?? null,
        completed_at: new Date(),
      },
      { transaction }
    );

    const candidate = await AgentCandidate.findByPk(escalation.candidate_id, { transaction });
    if (!candidate) return;

    // A team leader's outcome lands the candidate where the same telecaller
    // outcome would: Proceed → INTERESTED, Not Interested → closed.
    if (tlResult === "Proceed") {
      await candidate.update({ status: interestedStatusFor(candidate.status) }, { transaction });
    } else if (tlResult === "Not Interested") {
      await candidate.update(
        { status: "NOT_INTERESTED", follow_up_date: null, follow_up_time: null },
        { transaction }
      );
    } else if (status === "ReturnedToTelecaller" && tlNote) {
      // The telecaller next meets this lead in the Calls queue, which shows the
      // last call note — so that is where the leader's guidance has to be.
      await candidate.update({ last_call_note: `TL guidance: ${tlNote}` }, { transaction });
    }
  });

  return getEscalationById(id);
};

/* =====================================================
   OFFICE VISITS / ONBOARDING
===================================================== */

export const listOfficeVisits = async (filters = {}) => {
  const where = {};
  if (filters.status && filters.status !== "All") where.status = filters.status;
  if (filters.regionalOffice) where.regional_office = filters.regionalOffice;
  if (filters.candidateId) where.candidate_id = Number(filters.candidateId);

  if (filters.date) {
    where.visit_date = filters.date;
  } else if (filters.dateFrom || filters.dateTo) {
    where.visit_date = {};
    if (filters.dateFrom) where.visit_date[Op.gte] = filters.dateFrom;
    if (filters.dateTo) where.visit_date[Op.lte] = filters.dateTo;
  }

  return AgentOfficeVisit.findAll({
    where,
    include: [
      {
        model: AgentCandidate,
        as: "candidate",
        required: false,
        include: LEAD_INCLUDES,
      },
      {
        model: Employee,
        as: "assignedEmployee",
        attributes: ["id", "name", "phone"],
        required: false,
      },
    ],
    order: [
      ["visit_date", "ASC"],
      ["visit_time", "ASC"],
    ],
  });
};

/**
 * Book an interested candidate in to a regional office. Re-booking a candidate
 * who already has a scheduled visit moves that visit rather than creating a
 * second one — the desk means "reschedule", not "invite them twice".
 */
export const scheduleOfficeVisit = async (employeeId, payload = {}) => {
  const candidateId = payload.candidateId ?? payload.leadId;
  const regionalOffice = payload.regionalOffice;
  const visitDate = payload.visitDate;

  if (!candidateId) throw httpError("A candidate is required");
  if (!regionalOffice) throw httpError("A regional office is required");
  if (!visitDate) throw httpError("A visit date is required");

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Candidate not found", 404);

  const existing = await AgentOfficeVisit.findOne({
    where: { candidate_id: Number(candidateId), status: "Scheduled" },
  });

  const values = {
    candidate_id: Number(candidateId),
    regional_office: regionalOffice,
    visit_date: visitDate,
    visit_time: payload.visitTime ?? null,
    interested_village: payload.interestedVillage ?? candidate.selected_village ?? null,
    assigned_employee_id: payload.assignedEmployeeId ?? employeeId ?? null,
    notes: payload.notes ?? null,
    status: "Scheduled",
  };

  const visit = existing ? await existing.update(values) : await AgentOfficeVisit.create(values);

  await candidate.update({ status: "OFFICE_VISIT" });

  return getOfficeVisitById(visit.id);
};

export const getOfficeVisitById = async (id) => {
  const visit = await AgentOfficeVisit.findByPk(id, {
    include: [
      { model: AgentCandidate, as: "candidate", required: false, include: LEAD_INCLUDES },
      {
        model: Employee,
        as: "assignedEmployee",
        attributes: ["id", "name", "phone"],
        required: false,
      },
    ],
  });
  if (!visit) throw httpError("Office visit not found", 404);
  return visit;
};

export const updateOfficeVisitStatus = async (id, payload = {}) => {
  const visit = await AgentOfficeVisit.findByPk(id);
  if (!visit) throw httpError("Office visit not found", 404);

  const status = payload.status;
  if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
    throw httpError("Status must be Scheduled, Completed or Cancelled");
  }

  await visit.update({
    status,
    completed_at: status === "Completed" ? new Date() : null,
    cancelled_reason: status === "Cancelled" ? payload.reason ?? null : null,
    notes: payload.notes ?? visit.notes,
  });

  // A cancelled visit drops the candidate back to interested so they reappear
  // in the Interested queue rather than vanishing from every list.
  if (status === "Cancelled") {
    const candidate = await AgentCandidate.findByPk(visit.candidate_id);
    if (candidate && candidate.status === "OFFICE_VISIT") {
      await candidate.update({ status: "INTERESTED" });
    }
  }

  return getOfficeVisitById(id);
};

/* =====================================================
   REPORTING
===================================================== */

/** Per-telecaller throughput for the Reporting tab and the TL performance panel. */
export const getTelecallerPerformance = async (filters = {}) => {
  const where = {};
  if (filters.dateFrom || filters.dateTo) {
    where.called_at = {};
    if (filters.dateFrom) where.called_at[Op.gte] = new Date(filters.dateFrom);
    if (filters.dateTo) where.called_at[Op.lte] = new Date(filters.dateTo);
  }

  const rows = await AgentCallAttempt.findAll({
    where,
    attributes: [
      "employee_id",
      [fn("COUNT", col("AgentCallAttempt.id")), "attempts"],
      [
        fn("SUM", literal(`CASE WHEN answer_status = 'Answered' THEN 1 ELSE 0 END`)),
        "answered",
      ],
      [fn("SUM", literal(`CASE WHEN result = 'Proceed' THEN 1 ELSE 0 END`)), "proceeded"],
      [
        fn("SUM", literal(`CASE WHEN result = 'Not Interested' THEN 1 ELSE 0 END`)),
        "rejected",
      ],
      [fn("COALESCE", fn("SUM", col("duration_seconds")), 0), "talk_seconds"],
    ],
    include: [
      { model: Employee, as: "employee", attributes: ["id", "name"], required: false },
    ],
    group: ["AgentCallAttempt.employee_id", "employee.id"],
    raw: true,
    nest: true,
  });

  return rows.map((row) => {
    const attempts = Number(row.attempts) || 0;
    const answered = Number(row.answered) || 0;
    return {
      employee_id: row.employee_id,
      employee_name: row.employee?.name || "Unattributed",
      attempts,
      answered,
      proceeded: Number(row.proceeded) || 0,
      rejected: Number(row.rejected) || 0,
      talk_seconds: Number(row.talk_seconds) || 0,
      connect_rate: attempts ? Math.round((answered / attempts) * 100) : 0,
    };
  });
};

/** Lead volume by source, for the Leads tab's source breakdown. */
export const getLeadSourceBreakdown = async () => {
  const rows = await AgentCandidate.findAll({
    attributes: ["lead_source", [fn("COUNT", col("id")), "count"]],
    group: ["lead_source"],
    raw: true,
  });

  return rows.map((row) => ({
    source: row.lead_source || "DIRECT",
    count: Number(row.count) || 0,
  }));
};
