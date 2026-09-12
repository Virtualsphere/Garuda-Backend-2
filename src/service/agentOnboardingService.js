import sequelize from "../db/db.js";
import {
  Agent,
  AgentCandidate,
  AgentOfficeVisit,
  AgentTransaction,
  AgentVillage,
  CandidateVillageInterest,
  VillagePosition,
} from "../model/associationModel.js";
import { getAgentLedger } from "./agentFinanceService.js";

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

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const norm = (value) => String(value || "").trim().toLowerCase();

/**
 * Turn a recruitment candidate into an appointed agent.
 *
 * This is deliberately one transaction: it creates the agent, attaches them to
 * the village seat, records the joining money and stamps the candidate as
 * converted. Half-completing it would leave a seat marked filled with nobody in
 * it, or an agent with no seat — both of which the recruitment map would then
 * render as truth.
 *
 * Idempotent: a candidate already converted returns their existing agent rather
 * than creating a second one.
 */
export const onboardCandidate = async (employeeId, payload = {}) => {
  const candidateId = payload.candidateId ?? payload.leadId;
  if (!candidateId) throw httpError("A candidate is required");

  const candidate = await AgentCandidate.findByPk(candidateId);
  if (!candidate) throw httpError("Candidate not found", 404);

  // Already appointed — hand back who they became.
  if (candidate.converted_agent_id) {
    const existing = await Agent.findByPk(candidate.converted_agent_id);
    if (existing) return { agent: existing, alreadyOnboarded: true };
  }

  const village = payload.village ?? candidate.selected_village ?? candidate.village;
  if (!village) {
    throw httpError("A village is required to attach the agent to");
  }

  const mandal = payload.mandal ?? candidate.mandal;
  const district = payload.district ?? candidate.district;
  const state = payload.state ?? candidate.state;

  // The paperwork gate. The desk can record an agent on paper, but it must be
  // explicit rather than an accident of a half-filled form.
  const idProofUploaded = Boolean(payload.idProofUploaded);
  const agreementUploaded = Boolean(payload.agreementUploaded);

  if (!payload.allowIncompletePaperwork && (!idProofUploaded || !agreementUploaded)) {
    throw httpError(
      "ID proof and the signed agreement must both be recorded before onboarding. Pass allowIncompletePaperwork to override.",
      409
    );
  }

  const membershipAmount = money(payload.membershipAmount ?? 0);
  const securityDeposit = money(payload.securityDeposit ?? 0);

  /**
   * A candidate whose native village is full can still be appointed — held on
   * that village's waiting list while being attached to other villages they
   * chose. "queue" says that is what is happening, so the seat in the native
   * village is NOT consumed.
   */
  const nativeQueued = payload.nativeVillageAction === "queue";

  // Which villages go into the legal deed. Falls back to the primary village
  // so a caller that does not know about multi-village agreements still works.
  const agreementVillages = Array.isArray(payload.agreementVillages) &&
    payload.agreementVillages.length
      ? payload.agreementVillages
      : [village];

  if (nativeQueued) {
    // Queuing the native village and then seating them in it would both hold
    // and consume the same slot — the one contradiction this flow must refuse.
    if (candidate.village && norm(village) === norm(candidate.village)) {
      throw httpError(
        `${candidate.village} is queued, so it cannot also be the village the agent is attached to. Pick one of their other chosen villages.`,
        409
      );
    }

    if (!agreementVillages.some((v) => norm(v) !== norm(candidate.village || ""))) {
      throw httpError(
        "A queued native village needs at least one other village in the agreement, or there is nothing to attach the agent to.",
        409
      );
    }
  }

  return sequelize.transaction(async (tx) => {
    const agent = await Agent.create(
      {
        name: candidate.name,
        phone: candidate.phone,
        alternate_phone: candidate.alternate_phone,
        email: candidate.email,
        photo: candidate.photo,
        state,
        district,
        mandal,
        village,
        address: payload.address ?? null,
        joining_date: payload.joiningDate ?? new Date().toISOString().slice(0, 10),
        status: "ACTIVE",
        membership_status: membershipAmount > 0 ? "PAID" : "PENDING",
        membership_amount: membershipAmount,
        security_deposit: securityDeposit,
        lead_source: candidate.lead_source,
        refered_by: candidate.referring_agent_id ?? null,
        source_candidate_id: candidate.id,

        id_proof_url: payload.idProofUrl ?? null,
        id_proof_uploaded: idProofUploaded,
        address_proof_url: payload.addressProofUrl ?? null,
        address_proof_uploaded: Boolean(payload.addressProofUploaded),
        agreement_url: payload.agreementUrl ?? null,
        agreement_uploaded: agreementUploaded,

        onboarded_by: employeeId ?? null,
        onboarding_completed_at: new Date(),
        agreement_date: payload.agreementDate ?? null,
        receipt_no: payload.receiptNo ?? null,
        native_village_queued: nativeQueued,
        native_village_queue_reason: nativeQueued
          ? payload.nativeVillageQueueReason ?? null
          : null,
      },
      { transaction: tx }
    );

    // Every agreement village other than the primary one becomes an explicit
    // territory row. A queued native village is deliberately not among them.
    const extraNames = new Set(
      [
        ...agreementVillages,
        ...(Array.isArray(payload.additionalVillages)
          ? payload.additionalVillages.map((v) => v?.village)
          : []),
      ].filter(Boolean)
    );

    for (const name of extraNames) {
      if (norm(name) === norm(village)) continue;
      if (nativeQueued && norm(name) === norm(candidate.village)) continue;
      await AgentVillage.create(
        {
          agent_id: agent.id,
          state,
          district,
          mandal,
          village: name,
        },
        { transaction: tx }
      );
    }

    // Held on the native village's waiting list rather than taking its seat.
    if (nativeQueued && candidate.village) {
      const existing = await CandidateVillageInterest.findOne({
        where: { candidate_id: candidate.id, village: candidate.village },
        transaction: tx,
      });
      const values = {
        candidate_id: candidate.id,
        state,
        district,
        mandal,
        village: candidate.village,
        status: "WAITING",
        notes: payload.nativeVillageQueueReason ?? null,
      };
      if (existing) await existing.update(values, { transaction: tx });
      else await CandidateVillageInterest.create(values, { transaction: tx });
    }

    // Fill the seat they were selected for, or the lowest open seat in the
    // village. A village with no synced seats simply gets no seat filled —
    // the agent still exists, which is what the desk cares about.
    const seat = payload.positionId
      ? await VillagePosition.findByPk(payload.positionId, { transaction: tx })
      : await VillagePosition.findOne({
          where: { village, status: ["VACANT", "NATIVE_SEARCH", "WAITING_CANDIDATES_AVAILABLE", "OPEN_TO_WAITING_CANDIDATES", "CANDIDATE_SELECTED", "JOINING"] },
          order: [["position_number", "ASC"]],
          transaction: tx,
        });

    if (seat && seat.status !== "FILLED") {
      await seat.update(
        {
          status: "FILLED",
          agent_id: agent.id,
          selected_candidate_id: candidate.id,
        },
        { transaction: tx }
      );
    }

    // Joining money, as ledger lines so the finance tab shows where it came
    // from rather than an opaque figure on the agent row.
    const transactions = [];

    if (membershipAmount > 0) {
      transactions.push({
        agent_id: agent.id,
        type: "MEMBERSHIP_FEE",
        amount: membershipAmount,
        status: "PAID",
        payment_mode: payload.paymentMode ?? "CASH",
        reference_no: payload.referenceNo ?? null,
        transaction_date: new Date().toISOString().slice(0, 10),
        notes: "Membership fee collected at onboarding",
        created_by: employeeId ?? null,
      });
    }

    if (securityDeposit > 0) {
      transactions.push({
        agent_id: agent.id,
        type: "OTHER",
        amount: securityDeposit,
        status: "PAID",
        payment_mode: payload.paymentMode ?? "CASH",
        reference_no: payload.referenceNo ?? null,
        transaction_date: new Date().toISOString().slice(0, 10),
        notes: "Refundable security deposit collected at onboarding",
        created_by: employeeId ?? null,
      });
    }

    for (const row of transactions) {
      const created = await AgentTransaction.create(row, { transaction: tx });
      await created.update(
        { transaction_code: `TXN-${String(created.id).padStart(6, "0")}` },
        { transaction: tx }
      );
    }

    await candidate.update(
      {
        status: "JOINED",
        converted_agent_id: agent.id,
        selected_village: village,
      },
      { transaction: tx }
    );

    // Close the visit that brought them in, if there is one open.
    await AgentOfficeVisit.update(
      { status: "Completed", completed_at: new Date() },
      { where: { candidate_id: candidate.id, status: "Scheduled" }, transaction: tx }
    );

    return { agent, seat: seat || null, alreadyOnboarded: false };
  });
};

/**
 * Record or correct an agent's paperwork after the fact — the desk often gets
 * the signed agreement days after the agent starts working.
 */
export const updateAgentPaperwork = async (agentId, payload = {}) => {
  const agent = await Agent.findByPk(agentId);
  if (!agent) throw httpError("Agent not found", 404);

  const patch = {};
  const fields = {
    idProofUrl: "id_proof_url",
    idProofUploaded: "id_proof_uploaded",
    addressProofUrl: "address_proof_url",
    addressProofUploaded: "address_proof_uploaded",
    agreementUrl: "agreement_url",
    agreementUploaded: "agreement_uploaded",
  };

  for (const [key, column] of Object.entries(fields)) {
    if (payload[key] !== undefined) patch[column] = payload[key];
  }

  await agent.update(patch);
  return agent;
};

/** Everything the onboarding wizard needs to show a finished agent. */
export const getOnboardingSummary = async (agentId) => {
  const ledger = await getAgentLedger(agentId);
  const villages = await AgentVillage.findAll({ where: { agent_id: agentId } });
  const seat = await VillagePosition.findOne({ where: { agent_id: agentId } });

  return { ...ledger, additionalVillages: villages, seat };
};
