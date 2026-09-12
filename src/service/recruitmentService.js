import { Op } from "sequelize";
import sequelize from "../db/db.js";
import {
  Agent,
  AgentCandidate,
  CandidateStatusHistory,
  VillagePosition,
  CandidateVillageInterest,
} from "../model/associationModel.js";
import { TERMINAL_CANDIDATE_STATUSES } from "../model/agentCandidateModel.js";
import { OPEN_POSITION_STATUSES } from "../model/villagePositionModel.js";
import * as settingsService from "./settingsService.js";

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

const norm = (value) => String(value || "").trim().toLowerCase();

const sameVillage = (a, b) => Boolean(norm(a)) && norm(a) === norm(b);

/**
 * How many agents a village's acreage calls for, per the shared
 * `required_agents_slabs` setting. This is the SAME setting the admin UI reads,
 * so capacity has exactly one definition across the stack.
 *
 * Above the top slab the highest requirement is held.
 */
const DEFAULT_SLABS = [
  { from: "0", to: "500", agents: "5" },
  { from: "501", to: "1000", agents: "12" },
  { from: "1001", to: "2000", agents: "25" },
  { from: "2001", to: "5000", agents: "50" },
];

export const getRequiredAgentsSlabs = async () => {
  try {
    const setting = await settingsService.getSettingByKey("required_agents_slabs");
    const value = setting?.value;
    return Array.isArray(value) && value.length ? value : DEFAULT_SLABS;
  } catch {
    return DEFAULT_SLABS;
  }
};

export const requiredAgentsFor = (acres, slabs = DEFAULT_SLABS) => {
  const value = Number(acres) || 0;
  const ordered = [...slabs].sort((a, b) => Number(a.from) - Number(b.from));

  const match = ordered.find(
    (slab) => value >= Number(slab.from) && value <= Number(slab.to)
  );
  if (match) return Number(match.agents) || 0;

  const top = ordered[ordered.length - 1];
  if (top && value > Number(top.to)) return Number(top.agents) || 0;

  return 0;
};

/** Total land acreage per village, keyed by lowercased village name. */
const getVillageAcreage = async () => {
  const [rows] = await sequelize.query(`
    SELECT LOWER(l.village) AS village_key,
           COALESCE(SUM(ld.total_acres), 0) AS total_acres
    FROM land l
    LEFT JOIN land_details ld ON ld.land_id = l.id
    WHERE l.village IS NOT NULL AND l.village <> ''
    GROUP BY LOWER(l.village)
  `);

  const map = {};
  rows.forEach((r) => { map[r.village_key] = Number(r.total_acres) || 0; });
  return map;
};

/* =====================================================
   CANDIDATES
===================================================== */

export const listCandidates = async (filters = {}) => {
  const { state, district, mandal, village, status, assignedEmployeeId, search, activeOnly } = filters;

  const where = {};
  if (state) where.state = state;
  if (district) where.district = district;
  if (mandal) where.mandal = mandal;
  if (village) where.village = village;
  if (status) where.status = status;
  if (assignedEmployeeId) where.assigned_employee_id = assignedEmployeeId;
  if (activeOnly === true || activeOnly === "true") {
    where.status = { [Op.notIn]: TERMINAL_CANDIDATE_STATUSES };
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return await AgentCandidate.findAll({
    where,
    include: [{ model: CandidateVillageInterest, as: "interests" }],
    order: [["created_at", "DESC"]],
  });
};

export const getCandidateById = async (id) => {
  const candidate = await AgentCandidate.findByPk(id, {
    include: [{ model: CandidateVillageInterest, as: "interests" }],
  });
  if (!candidate) throw httpError("Candidate not found", 404);

  const history = await CandidateStatusHistory.findAll({
    where: { candidate_id: id },
    order: [["created_at", "DESC"]],
  });

  return { ...candidate.toJSON(), history };
};

export const createCandidate = async (employeeId, data) => {
  const { name, phone } = data;
  if (!name) throw httpError("Candidate name is required");
  if (!phone) throw httpError("Candidate phone is required");

  return await sequelize.transaction(async (transaction) => {
    const candidate = await AgentCandidate.create(
      {
        name,
        phone,
        alternate_phone: data.alternate_phone,
        email: data.email,
        state: data.state,
        district: data.district,
        mandal: data.mandal,
        village: data.village,
        lead_source: data.lead_source || "DIRECT",
        candidate_type: data.candidate_type || "NATIVE",
        status: data.status || "NEW_LEAD",
        call_status: data.call_status,
        assigned_employee_id: data.assigned_employee_id || employeeId,
        team_leader_id: data.team_leader_id,
        notes: data.notes,
        created_by: employeeId,
      },
      { transaction }
    );

    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: null,
        to_status: candidate.status,
        employee_id: employeeId,
        notes: "Candidate created",
      },
      { transaction }
    );

    return candidate;
  });
};

export const updateCandidate = async (id, data) => {
  const candidate = await AgentCandidate.findByPk(id);
  if (!candidate) throw httpError("Candidate not found", 404);

  // Status moves go through transitionCandidateStatus so history is always written.
  const { status, ...safe } = data;
  await candidate.update(safe);
  return candidate;
};

export const transitionCandidateStatus = async (id, toStatus, employeeId, notes) => {
  if (!toStatus) throw httpError("A target status is required");

  return await sequelize.transaction(async (transaction) => {
    const candidate = await AgentCandidate.findByPk(id, { transaction });
    if (!candidate) throw httpError("Candidate not found", 404);

    const fromStatus = candidate.status;
    if (fromStatus === toStatus) return candidate;

    await candidate.update({ status: toStatus }, { transaction });

    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: fromStatus,
        to_status: toStatus,
        employee_id: employeeId,
        notes,
      },
      { transaction }
    );

    // Withdrawing or rejecting a candidate releases any seat held for them.
    if (TERMINAL_CANDIDATE_STATUSES.includes(toStatus)) {
      await VillagePosition.update(
        {
          status: "VACANT",
          selected_candidate_id: null,
          is_native: null,
        },
        { where: { selected_candidate_id: candidate.id }, transaction }
      );

      await CandidateVillageInterest.update(
        { status: "WITHDRAWN" },
        {
          where: {
            candidate_id: candidate.id,
            status: { [Op.notIn]: ["JOINED", "WITHDRAWN", "REJECTED"] },
          },
          transaction,
        }
      );
    }

    return candidate;
  });
};

/**
 * Promote a selected candidate into a real `agent` row, fill their seat and
 * close their other interests — all atomically.
 */
export const convertCandidateToAgent = async (id, employeeId) => {
  return await sequelize.transaction(async (transaction) => {
    const candidate = await AgentCandidate.findByPk(id, { transaction });
    if (!candidate) throw httpError("Candidate not found", 404);
    if (candidate.converted_agent_id) {
      throw httpError("This candidate has already been appointed", 409);
    }

    const position = await VillagePosition.findOne({
      where: { selected_candidate_id: candidate.id },
      transaction,
    });

    if (!position) {
      throw httpError(
        "Select this candidate for a village seat before appointing them",
        409
      );
    }

    // Capture the stage before the update below — reading it afterwards would
    // record a JOINED → JOINED transition instead of the real one.
    const fromStatus = candidate.status;

    const agent = await Agent.create(
      {
        name: candidate.name,
        phone: candidate.phone,
        alternate_phone: candidate.alternate_phone,
        email: candidate.email,
        state: position.state || candidate.state,
        district: position.district || candidate.district,
        mandal: position.mandal || candidate.mandal,
        village: position.village,
        refered_by: employeeId,
        joining_date: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        membership_status: "PENDING",
        lead_source: candidate.lead_source,
        source_candidate_id: candidate.id,
      },
      { transaction }
    );

    await position.update(
      {
        status: "FILLED",
        agent_id: agent.id,
        selected_candidate_id: null,
      },
      { transaction }
    );

    await candidate.update(
      {
        status: "JOINED",
        converted_agent_id: agent.id,
        selected_village: position.village,
      },
      { transaction }
    );

    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: fromStatus,
        to_status: "JOINED",
        employee_id: employeeId,
        notes: `Appointed as agent for ${position.village}`,
      },
      { transaction }
    );

    // The village they joined becomes JOINED; every other interest closes.
    await CandidateVillageInterest.update(
      { status: "WITHDRAWN" },
      {
        where: {
          candidate_id: candidate.id,
          village: { [Op.ne]: position.village },
          status: { [Op.notIn]: ["WITHDRAWN", "REJECTED"] },
        },
        transaction,
      }
    );

    await CandidateVillageInterest.update(
      { status: "JOINED" },
      { where: { candidate_id: candidate.id, village: position.village }, transaction }
    );

    return { agent, candidate, position };
  });
};

/* =====================================================
   VILLAGE INTERESTS
===================================================== */

/**
 * Attach a candidate to one or more villages. `is_native` is always derived
 * here from the candidate's home village — never taken from the caller.
 *
 * A non-native registering interest in a village whose seats are still under
 * native search waits; a native goes straight into the active pool.
 */
export const addCandidateInterests = async (candidateId, villages = []) => {
  if (!Array.isArray(villages) || villages.length === 0) {
    throw httpError("At least one village is required");
  }

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Candidate not found", 404);

  const today = new Date().toISOString().split("T")[0];

  return await sequelize.transaction(async (transaction) => {
    const created = [];

    for (const entry of villages) {
      const villageName = typeof entry === "string" ? entry : entry?.village;
      if (!villageName) continue;

      const isNative = sameVillage(candidate.village, villageName);

      // Is any seat in this village already open to outside candidates?
      const openedSeat = await VillagePosition.findOne({
        where: {
          village: villageName,
          status: "OPEN_TO_WAITING_CANDIDATES",
        },
        transaction,
      });

      const status = isNative
        ? "INTERESTED"
        : openedSeat
          ? "VACANCY_AVAILABLE"
          : "NATIVE_PRIORITY_WAIT";

      const [row] = await CandidateVillageInterest.findOrCreate({
        where: { candidate_id: candidate.id, village: villageName },
        defaults: {
          candidate_id: candidate.id,
          state: entry?.state || candidate.state,
          district: entry?.district || candidate.district,
          mandal: entry?.mandal || candidate.mandal,
          village: villageName,
          is_native: isNative,
          status,
          interested_since: today,
          notes: entry?.notes,
        },
        transaction,
      });

      created.push(row);
    }

    // Interest in more than one village reclassifies the candidate.
    const total = await CandidateVillageInterest.count({
      where: { candidate_id: candidate.id },
      transaction,
    });

    const nativeCount = await CandidateVillageInterest.count({
      where: { candidate_id: candidate.id, is_native: true },
      transaction,
    });

    await candidate.update(
      {
        candidate_type:
          total > 1 ? "MULTIPLE_VILLAGE" : nativeCount > 0 ? "NATIVE" : "OUTSIDE_VILLAGE",
      },
      { transaction }
    );

    return created;
  });
};

export const removeCandidateInterest = async (interestId) => {
  const interest = await CandidateVillageInterest.findByPk(interestId);
  if (!interest) throw httpError("Interest not found", 404);

  if (["SELECTED", "JOINING", "JOINED"].includes(interest.status)) {
    throw httpError(
      "This interest is tied to a selection — withdraw the candidate instead",
      409
    );
  }

  await interest.destroy();
  return { id: interestId };
};

/* =====================================================
   VILLAGE POSITIONS
===================================================== */

/**
 * Positions with derived capacity: `required` comes from the acreage slabs,
 * `deployed` from real agent rows, and `vacancy` is the difference.
 */
export const listPositions = async (filters = {}) => {
  const { state, district, mandal, village, status } = filters;

  const where = {};
  if (state) where.state = state;
  if (district) where.district = district;
  if (mandal) where.mandal = mandal;
  if (village) where.village = village;
  if (status) where.status = status;

  const positions = await VillagePosition.findAll({
    where,
    // The seat rows carry only ids; the recruitment map renders who is in the
    // seat, so resolve both sides here rather than making the client join.
    include: [
      {
        model: Agent,
        as: "agent",
        attributes: ["id", "name", "phone", "photo", "status"],
        required: false,
      },
      {
        model: AgentCandidate,
        as: "selectedCandidate",
        attributes: ["id", "name", "phone", "status", "village"],
        required: false,
      },
    ],
    order: [["village", "ASC"], ["position_number", "ASC"]],
  });

  const [slabs, acreage] = await Promise.all([
    getRequiredAgentsSlabs(),
    getVillageAcreage(),
  ]);

  const agentCounts = await Agent.findAll({
    attributes: ["village", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["village"],
    raw: true,
  });

  const deployedByVillage = {};
  agentCounts.forEach((row) => {
    deployedByVillage[norm(row.village)] = Number(row.count) || 0;
  });

  return positions.map((p) => {
    const key = norm(p.village);
    const acres = acreage[key] || 0;
    const required = requiredAgentsFor(acres, slabs);
    const deployed = deployedByVillage[key] || 0;

    return {
      ...p.toJSON(),
      total_acres: acres,
      required_agents: required,
      deployed_agents: deployed,
      vacancy: Math.max(required - deployed, 0),
    };
  });
};

/**
 * Reconcile a village's seats against what its acreage requires: create the
 * missing ones, leave existing ones alone. Never deletes a seat that is filled
 * or has a candidate attached.
 */
export const syncVillagePositions = async ({ state, district, mandal, village }) => {
  if (!village) throw httpError("A village is required");

  const [slabs, acreage] = await Promise.all([
    getRequiredAgentsSlabs(),
    getVillageAcreage(),
  ]);

  const required = requiredAgentsFor(acreage[norm(village)] || 0, slabs);

  return await sequelize.transaction(async (transaction) => {
    const existing = await VillagePosition.findAll({
      where: { village },
      order: [["position_number", "ASC"]],
      transaction,
    });

    const toCreate = Math.max(required - existing.length, 0);
    const startAt = existing.length
      ? Math.max(...existing.map((p) => p.position_number)) + 1
      : 1;

    const created = [];
    for (let i = 0; i < toCreate; i += 1) {
      const row = await VillagePosition.create(
        {
          position_number: startAt + i,
          state,
          district,
          mandal,
          village,
          status: "NATIVE_SEARCH",
        },
        { transaction }
      );
      created.push(row);
    }

    return { village, required, existing: existing.length, created: created.length };
  });
};

/**
 * Release a seat to non-native candidates. This is the deliberate act that
 * ends native priority for that seat, so it is audited.
 */
export const openPositionToWaiting = async (positionId, employeeId, remarks) => {
  return await sequelize.transaction(async (transaction) => {
    const position = await VillagePosition.findByPk(positionId, { transaction });
    if (!position) throw httpError("Position not found", 404);

    if (!OPEN_POSITION_STATUSES.includes(position.status)) {
      throw httpError(
        `A seat that is ${position.status} cannot be opened to waiting candidates`,
        409
      );
    }

    await position.update(
      {
        status: "OPEN_TO_WAITING_CANDIDATES",
        opened_to_waiting_at: new Date(),
        opened_by: employeeId,
        opened_remarks: remarks || "Opened to outside candidates after review",
      },
      { transaction }
    );

    // Everyone waiting on native priority in this village can now be considered.
    const [affected] = await CandidateVillageInterest.update(
      { status: "VACANCY_AVAILABLE" },
      {
        where: {
          village: position.village,
          is_native: false,
          status: { [Op.in]: ["NATIVE_PRIORITY_WAIT", "WAITING"] },
        },
        transaction,
      }
    );

    return { position, promoted: affected };
  });
};

/**
 * Select a candidate for a seat.
 *
 * The native-priority rule lives here, not in the UI: a non-native cannot take
 * a seat that is still under native search. The seat must be opened first.
 */
export const selectCandidateForPosition = async (positionId, candidateId, employeeId) => {
  return await sequelize.transaction(async (transaction) => {
    const position = await VillagePosition.findByPk(positionId, { transaction });
    if (!position) throw httpError("Position not found", 404);

    const candidate = await AgentCandidate.findByPk(candidateId, { transaction });
    if (!candidate) throw httpError("Candidate not found", 404);

    if (!OPEN_POSITION_STATUSES.includes(position.status)) {
      throw httpError(
        `This seat is ${position.status} and cannot take a new selection`,
        409
      );
    }

    const isNative = sameVillage(candidate.village, position.village);

    if (!isNative && position.status === "NATIVE_SEARCH") {
      throw httpError(
        `${candidate.name} is not native to ${position.village}. Open this seat to waiting candidates before selecting them.`,
        409
      );
    }

    await position.update(
      {
        status: "CANDIDATE_SELECTED",
        selected_candidate_id: candidate.id,
        is_native: isNative,
      },
      { transaction }
    );

    const fromStatus = candidate.status;
    await candidate.update(
      { status: "SELECTED", selected_village: position.village },
      { transaction }
    );

    await CandidateStatusHistory.create(
      {
        candidate_id: candidate.id,
        from_status: fromStatus,
        to_status: "SELECTED",
        employee_id: employeeId,
        notes: `Selected for ${position.village} (${isNative ? "native" : "outside"} candidate)`,
      },
      { transaction }
    );

    await CandidateVillageInterest.update(
      { status: "SELECTED" },
      { where: { candidate_id: candidate.id, village: position.village }, transaction }
    );

    return { position, candidate };
  });
};

/* =====================================================
   STATS
===================================================== */

export const getRecruitmentStats = async () => {
  const [pipelineRows, positionRows, interestRows] = await Promise.all([
    AgentCandidate.findAll({
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true,
    }),
    VillagePosition.findAll({
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true,
    }),
    CandidateVillageInterest.findAll({
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true,
    }),
  ]);

  const toMap = (rows) => {
    const map = {};
    rows.forEach((r) => { map[r.status] = Number(r.count) || 0; });
    return map;
  };

  const pipeline = toMap(pipelineRows);
  const totalCandidates = Object.values(pipeline).reduce((a, b) => a + b, 0);
  const activeCandidates = Object.entries(pipeline)
    .filter(([status]) => !TERMINAL_CANDIDATE_STATUSES.includes(status))
    .reduce((sum, [, count]) => sum + count, 0);

  return {
    pipeline,
    positions: toMap(positionRows),
    interests: toMap(interestRows),
    totalCandidates,
    activeCandidates,
  };
};
