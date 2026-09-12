import { Op } from "sequelize";
import {
  Agent,
  Land,
  LandObservation,
  LandObservationSubmission,
  LandDetails,
} from "../model/associationModel.js";
import { FREQUENCY_DAYS } from "../model/landObservationModel.js";

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

/**
 * Next date a report is expected. ONE_TIME and ON_REQUEST have no cadence, so
 * they get no automatic date — the desk sets one by hand or leaves it open.
 */
export const nextDueDateFor = (frequency, from = new Date()) => {
  const days = FREQUENCY_DAYS[frequency];
  if (!days) return null;

  const base = from instanceof Date ? new Date(from) : new Date(String(from));
  if (Number.isNaN(base.getTime())) return null;

  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

/* =====================================================
   ASSIGNMENTS
===================================================== */

export const listObservations = async (filters = {}) => {
  const { agentId, landId, status, dueOnly, village, mandal } = filters;

  const where = {};
  if (agentId) where.agent_id = Number(agentId);
  if (landId) where.land_id = Number(landId);
  if (status) where.status = status;

  // Everything whose next report is due today or earlier — the set the map
  // renders with the red "information due" ping.
  if (String(dueOnly) === "true") {
    where.next_due_date = { [Op.ne]: null, [Op.lte]: today() };
    where.status = { [Op.notIn]: ["CLOSED", "UPDATE_SUBMITTED"] };
  }

  const landWhere = {};
  if (village) landWhere.village = village;
  if (mandal) landWhere.mandal = mandal;

  return LandObservation.findAll({
    where,
    include: [
      {
        model: Agent,
        as: "agent",
        attributes: ["id", "name", "phone", "photo", "village", "mandal"],
        required: false,
      },
      {
        model: Land,
        as: "land",
        attributes: [
          "id",
          "village",
          "mandal",
          "district",
          "state",
          "location_latitude",
          "location_longitude",
          // What the observation desk badges each parcel with.
          "land_sale_available_status",
          "verification_status",
          "agent_id",
        ],
        include: [
          {
            // Acreage and price live on land_details, not land — the
            // observation card is about what the parcel is worth, so it
            // needs them.
            model: LandDetails,
            as: "landDetails",
            attributes: ["total_acres", "guntas", "price_per_acres", "total_value"],
            required: false,
          },
        ],
        where: Object.keys(landWhere).length ? landWhere : undefined,
        required: Object.keys(landWhere).length > 0,
      },
    ],
    order: [
      ["next_due_date", "ASC NULLS LAST"],
      ["id", "DESC"],
    ],
  });
};

/**
 * Attach an agent to a land parcel as an observer, or update the cadence of an
 * attachment that already exists. Re-assigning is deliberately idempotent —
 * the desk reassigning the same pair should adjust it, not fail.
 */
export const assignObservation = async (employeeId, payload = {}) => {
  const landId = payload.landId ?? payload.land_id;
  const agentId = payload.agentId ?? payload.agent_id;
  const frequency = payload.frequency ?? "ONE_TIME";

  if (!landId) throw httpError("Land is required");
  if (!agentId) throw httpError("Agent is required");

  const [land, agent] = await Promise.all([
    Land.findByPk(landId),
    Agent.findByPk(agentId),
  ]);
  if (!land) throw httpError("Land not found", 404);
  if (!agent) throw httpError("Agent not found", 404);

  // The parcel's own agent is its primary link, not an observer.
  if (String(land.agent_id) === String(agentId)) {
    throw httpError(
      "This agent is already the primary agent on this land; an observation would duplicate that link.",
      409
    );
  }

  const nextDue =
    payload.nextDueDate ??
    payload.next_due_date ??
    nextDueDateFor(frequency);

  const existing = await LandObservation.findOne({
    where: { land_id: Number(landId), agent_id: Number(agentId) },
  });

  if (existing) {
    await existing.update({
      frequency,
      next_due_date: nextDue,
      notes: payload.notes ?? existing.notes,
      status: payload.status ?? "ACTIVE",
      assigned_by: employeeId ?? existing.assigned_by,
    });
    return getObservationById(existing.id);
  }

  const observation = await LandObservation.create({
    land_id: Number(landId),
    agent_id: Number(agentId),
    frequency,
    next_due_date: nextDue,
    notes: payload.notes ?? null,
    status: "ACTIVE",
    assigned_by: employeeId ?? null,
  });

  return getObservationById(observation.id);
};

/**
 * Assign several agents to several lands in one call — what the map's
 * multi-select "Assign Observation" action sends. Pairs that already exist are
 * updated rather than rejected, so a partially-overlapping selection still
 * succeeds as a whole.
 */
export const assignObservationsBulk = async (employeeId, payload = {}) => {
  const landIds = Array.isArray(payload.landIds) ? payload.landIds : [];
  const agentIds = Array.isArray(payload.agentIds)
    ? payload.agentIds
    : payload.agentId
    ? [payload.agentId]
    : [];

  if (!landIds.length) throw httpError("At least one land is required");
  if (!agentIds.length) throw httpError("At least one agent is required");

  const results = [];
  const skipped = [];

  for (const agentId of agentIds) {
    for (const landId of landIds) {
      try {
        results.push(
          await assignObservation(employeeId, {
            landId,
            agentId,
            frequency: payload.frequency,
            nextDueDate: payload.nextDueDate,
            notes: payload.notes,
          })
        );
      } catch (error) {
        // A primary-agent clash is expected in a bulk sweep; report it rather
        // than failing every other pair in the batch.
        skipped.push({ landId, agentId, reason: error.message });
      }
    }
  }

  return { assigned: results, skipped };
};

export const getObservationById = async (id) => {
  const observation = await LandObservation.findByPk(id, {
    include: [
      {
        model: Agent,
        as: "agent",
        attributes: ["id", "name", "phone", "photo"],
        required: false,
      },
      {
        model: Land,
        as: "land",
        attributes: ["id", "village", "mandal", "district", "state"],
        required: false,
      },
      {
        model: LandObservationSubmission,
        as: "submissions",
        required: false,
        separate: true,
        order: [["created_at", "DESC"]],
      },
    ],
  });

  if (!observation) throw httpError("Observation not found", 404);
  return observation;
};

export const updateObservation = async (id, payload = {}) => {
  const observation = await LandObservation.findByPk(id);
  if (!observation) throw httpError("Observation not found", 404);

  const patch = {};
  if (payload.frequency !== undefined) {
    patch.frequency = payload.frequency;
    // Changing cadence re-bases the due date unless one is given explicitly.
    if (payload.nextDueDate === undefined && payload.next_due_date === undefined) {
      patch.next_due_date = nextDueDateFor(payload.frequency);
    }
  }
  if (payload.nextDueDate !== undefined) patch.next_due_date = payload.nextDueDate;
  if (payload.next_due_date !== undefined) patch.next_due_date = payload.next_due_date;
  if (payload.status !== undefined) patch.status = payload.status;
  if (payload.notes !== undefined) patch.notes = payload.notes;

  await observation.update(patch);
  return getObservationById(id);
};

export const removeObservation = async ({ landId, agentId, id }) => {
  const observation = id
    ? await LandObservation.findByPk(id)
    : await LandObservation.findOne({
        where: { land_id: Number(landId), agent_id: Number(agentId) },
      });

  if (!observation) throw httpError("Observation not found", 404);

  await observation.destroy();
  return { id: observation.id };
};

/* =====================================================
   SUBMISSIONS
===================================================== */

/**
 * An agent files what they found on the ground. The submission is immutable;
 * filing one rolls the assignment's next due date forward and parks it in
 * VERIFICATION_PENDING for the desk to check.
 */
export const submitObservationInformation = async (payload = {}) => {
  const observationId = payload.observationId ?? payload.observation_id;
  if (!observationId) throw httpError("Observation is required");

  const observation = await LandObservation.findByPk(observationId);
  if (!observation) throw httpError("Observation not found", 404);

  const reported = payload.reportedPricePerAcre ?? payload.reported_price_per_acre;

  // What the last report said, so a price move can be read off one row.
  const previousSubmission = await LandObservationSubmission.findOne({
    where: { observation_id: observation.id },
    order: [["created_at", "DESC"]],
  });
  const previous =
    payload.previousPricePerAcre ??
    payload.previous_price_per_acre ??
    previousSubmission?.reported_price_per_acre ??
    null;

  let priceChange = "NO_CHANGE";
  if (reported != null && previous != null) {
    if (Number(reported) > Number(previous)) priceChange = "INCREASED";
    else if (Number(reported) < Number(previous)) priceChange = "DECREASED";
  }

  const submission = await LandObservationSubmission.create({
    observation_id: observation.id,
    land_id: observation.land_id,
    agent_id: observation.agent_id,
    is_available: payload.isAvailable ?? payload.is_available ?? "NOT_SURE",
    owner_willing_to_sell:
      payload.ownerWillingToSell ??
      payload.owner_willing_to_sell ??
      "NEED_CONFIRMATION",
    reported_price_per_acre: reported ?? null,
    previous_price_per_acre: previous,
    price_change_status: payload.priceChangeStatus ?? priceChange,
    buyer_activity: payload.buyerActivity ?? payload.buyer_activity ?? "UNKNOWN",
    land_sold: payload.landSold ?? payload.land_sold ?? "NO",
    agreement_made: payload.agreementMade ?? payload.agreement_made ?? "UNKNOWN",
    condition_change:
      payload.conditionChange ?? payload.condition_change ?? "NO_CHANGE",
    local_issue: payload.localIssue ?? payload.local_issue ?? "NO",
    remarks: payload.remarks ?? null,
    photos: Array.isArray(payload.photos) ? payload.photos : [],
    gps_latitude: payload.gpsLatitude ?? payload.gps_latitude ?? null,
    gps_longitude: payload.gpsLongitude ?? payload.gps_longitude ?? null,
    verification_status: "PENDING",
  });

  await observation.update({
    status: "VERIFICATION_PENDING",
    last_submitted_at: new Date(),
    next_due_date: nextDueDateFor(observation.frequency),
  });

  return submission;
};

export const listSubmissions = async (filters = {}) => {
  const { observationId, landId, agentId, verificationStatus } = filters;

  const where = {};
  if (observationId) where.observation_id = Number(observationId);
  if (landId) where.land_id = Number(landId);
  if (agentId) where.agent_id = Number(agentId);
  if (verificationStatus) where.verification_status = verificationStatus;

  return LandObservationSubmission.findAll({
    where,
    include: [
      {
        model: Agent,
        as: "agent",
        attributes: ["id", "name", "phone", "photo"],
        required: false,
      },
      {
        model: Land,
        as: "land",
        attributes: ["id", "village", "mandal", "district"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * The desk accepts or rejects a report. Approving closes the cycle
 * (UPDATED); rejecting sends the assignment back to UNABLE_TO_VERIFY so it
 * resurfaces in the queue.
 */
export const verifySubmission = async (id, payload = {}, employeeId) => {
  const submission = await LandObservationSubmission.findByPk(id);
  if (!submission) throw httpError("Submission not found", 404);

  const status = payload.verificationStatus ?? payload.status;
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw httpError("Verification status must be APPROVED or REJECTED");
  }

  await submission.update({
    verification_status: status,
    verified_by: employeeId ?? null,
    verified_at: new Date(),
    verified_price_per_acre:
      payload.verifiedPricePerAcre ??
      payload.verified_price_per_acre ??
      submission.verified_price_per_acre,
  });

  const observation = await LandObservation.findByPk(submission.observation_id);
  if (observation) {
    await observation.update({
      status: status === "APPROVED" ? "UPDATED" : "UNABLE_TO_VERIFY",
    });
  }

  return submission;
};

/* =====================================================
   DUE SWEEP
===================================================== */

/**
 * Flip every assignment whose next report has come due into INFORMATION_DUE.
 * Safe to call repeatedly — it only touches rows that are still ACTIVE or
 * UPDATED, so a report already in flight is never disturbed.
 */
export const markDueObservations = async () => {
  // On Postgres, Model.update resolves to [affectedCount] unless `returning`
  // is set — the row array is not the first element and is absent entirely
  // here, so the count has to come from index 0.
  const [affectedCount] = await LandObservation.update(
    { status: "INFORMATION_DUE" },
    {
      where: {
        next_due_date: { [Op.ne]: null, [Op.lte]: today() },
        status: { [Op.in]: ["ACTIVE", "UPDATED"] },
      },
    }
  );

  return { marked: Number(affectedCount) || 0 };
};
