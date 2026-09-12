import { Op } from "sequelize";
import { Agent, AgentTransaction, Land } from "../model/associationModel.js";
import { PAYABLE_TRANSACTION_TYPES } from "../model/agentTransactionModel.js";

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

const formatCode = (id) => `TXN-${String(id).padStart(6, "0")}`;

// Statuses where the money has actually moved. Anything else is a claim, not
// a payment, so the running totals must not count it.
const SETTLED_STATUSES = ["PAID", "PARTIAL"];

/**
 * Recompute an agent's commission_earned / commission_paid from the ledger,
 * so the running totals on `agent` can never drift from the rows they
 * summarise. Called after every write that changes a commission line.
 */
export const recalculateAgentTotals = async (agentId) => {
  const agent = await Agent.findByPk(agentId);
  if (!agent) return null;

  const rows = await AgentTransaction.findAll({
    where: {
      agent_id: agentId,
      type: { [Op.in]: ["COMMISSION", "INCENTIVE"] },
      status: { [Op.notIn]: ["REJECTED", "DRAFT"] },
    },
    attributes: ["status", "amount"],
    raw: true,
  });

  const earned = rows.reduce((sum, row) => sum + money(row.amount), 0);
  const paid = rows
    .filter((row) => SETTLED_STATUSES.includes(row.status))
    .reduce((sum, row) => sum + money(row.amount), 0);

  await agent.update({
    commission_earned: money(earned),
    commission_paid: money(paid),
  });

  return { commission_earned: money(earned), commission_paid: money(paid) };
};

/* =====================================================
   TRANSACTIONS
===================================================== */

export const listTransactions = async (filters = {}) => {
  const { agentId, type, status, dateFrom, dateTo, search } = filters;

  const where = {};
  if (agentId) where.agent_id = Number(agentId);
  if (type) where.type = type;
  if (status) where.status = status;

  if (dateFrom || dateTo) {
    where.transaction_date = {};
    if (dateFrom) where.transaction_date[Op.gte] = dateFrom;
    if (dateTo) where.transaction_date[Op.lte] = dateTo;
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    where[Op.or] = [
      { transaction_code: { [Op.iLike]: term } },
      { reference_no: { [Op.iLike]: term } },
      { notes: { [Op.iLike]: term } },
    ];
  }

  return AgentTransaction.findAll({
    where,
    include: [
      {
        model: Agent,
        as: "agent",
        attributes: ["id", "name", "phone", "village", "mandal", "district"],
        required: false,
      },
      {
        model: Land,
        as: "land",
        attributes: ["id", "village", "mandal"],
        required: false,
      },
    ],
    order: [
      ["transaction_date", "DESC"],
      ["id", "DESC"],
    ],
  });
};

export const getTransactionById = async (id) => {
  const transaction = await AgentTransaction.findByPk(id, {
    include: [
      {
        model: Agent,
        as: "agent",
        attributes: ["id", "name", "phone", "village", "mandal", "district"],
        required: false,
      },
    ],
  });

  if (!transaction) throw httpError("Transaction not found", 404);
  return transaction;
};

export const createTransaction = async (employeeId, payload = {}) => {
  const agentId = payload.agentId ?? payload.agent_id;
  const type = payload.type;
  const amount = money(payload.amount);

  if (!agentId) throw httpError("Agent is required");
  if (!type) throw httpError("Transaction type is required");
  if (!(amount > 0)) throw httpError("Amount must be greater than zero");

  const agent = await Agent.findByPk(agentId);
  if (!agent) throw httpError("Agent not found", 404);

  const transaction = await AgentTransaction.create({
    agent_id: Number(agentId),
    type,
    amount,
    status: payload.status ?? "PENDING",
    payment_mode: payload.paymentMode ?? payload.payment_mode ?? null,
    reference_no: payload.referenceNo ?? payload.reference_no ?? null,
    land_id: payload.landId ?? payload.land_id ?? null,
    transaction_date:
      payload.transactionDate ??
      payload.transaction_date ??
      new Date().toISOString().slice(0, 10),
    notes: payload.notes ?? null,
    receipt_url: payload.receiptUrl ?? payload.receipt_url ?? null,
    created_by: employeeId ?? null,
  });

  // The code embeds the generated id, so it can only be written post-insert.
  await transaction.update({ transaction_code: formatCode(transaction.id) });

  // A membership fee is the one line that also flips the agent's membership
  // flag, so the registry badge and the ledger agree.
  if (type === "MEMBERSHIP_FEE" && SETTLED_STATUSES.includes(transaction.status)) {
    await agent.update({ membership_status: "PAID", membership_amount: amount });
  }

  await recalculateAgentTotals(agentId);
  return getTransactionById(transaction.id);
};

export const updateTransaction = async (id, payload = {}) => {
  const transaction = await AgentTransaction.findByPk(id);
  if (!transaction) throw httpError("Transaction not found", 404);

  // A settled line is an accounting record; correcting it is a new entry, not
  // an edit of the old one.
  if (SETTLED_STATUSES.includes(transaction.status) && payload.amount !== undefined) {
    throw httpError(
      "A settled transaction cannot be re-priced; raise an adjusting entry instead.",
      409
    );
  }

  const updatable = {
    type: "type",
    amount: "amount",
    paymentMode: "payment_mode",
    referenceNo: "reference_no",
    landId: "land_id",
    transactionDate: "transaction_date",
    notes: "notes",
    receiptUrl: "receipt_url",
  };

  const patch = {};
  for (const [key, column] of Object.entries(updatable)) {
    if (payload[key] !== undefined) patch[column] = payload[key];
    else if (payload[column] !== undefined) patch[column] = payload[column];
  }

  if (patch.amount !== undefined) patch.amount = money(patch.amount);

  await transaction.update(patch);
  await recalculateAgentTotals(transaction.agent_id);
  return getTransactionById(id);
};

/**
 * Moves a transaction through its approval chain. APPROVED and PAID stamp the
 * approver so a payout is always attributable.
 */
export const updateTransactionStatus = async (id, status, employeeId) => {
  const transaction = await AgentTransaction.findByPk(id);
  if (!transaction) throw httpError("Transaction not found", 404);
  if (!status) throw httpError("Status is required");

  const patch = { status };

  if (["APPROVED", "PAID"].includes(status)) {
    patch.approved_by = employeeId ?? transaction.approved_by ?? null;
    patch.approved_at = new Date();
  }

  await transaction.update(patch);

  if (
    transaction.type === "MEMBERSHIP_FEE" &&
    SETTLED_STATUSES.includes(status)
  ) {
    const agent = await Agent.findByPk(transaction.agent_id);
    if (agent) {
      await agent.update({
        membership_status: "PAID",
        membership_amount: money(transaction.amount),
      });
    }
  }

  await recalculateAgentTotals(transaction.agent_id);
  return getTransactionById(id);
};

export const deleteTransaction = async (id) => {
  const transaction = await AgentTransaction.findByPk(id);
  if (!transaction) throw httpError("Transaction not found", 404);

  if (SETTLED_STATUSES.includes(transaction.status)) {
    throw httpError(
      "A settled transaction cannot be deleted; reverse it with a refund entry.",
      409
    );
  }

  const agentId = transaction.agent_id;
  await transaction.destroy();
  await recalculateAgentTotals(agentId);
  return { id: Number(id) };
};

/* =====================================================
   SUMMARY
===================================================== */

/**
 * Department-level finance rollup for the Finance tab: what has been paid out,
 * what is still owed, and what has been collected from agents.
 */
export const getFinanceSummary = async (filters = {}) => {
  const where = {};
  if (filters.agentId) where.agent_id = Number(filters.agentId);
  if (filters.dateFrom || filters.dateTo) {
    where.transaction_date = {};
    if (filters.dateFrom) where.transaction_date[Op.gte] = filters.dateFrom;
    if (filters.dateTo) where.transaction_date[Op.lte] = filters.dateTo;
  }

  const rows = await AgentTransaction.findAll({
    where,
    attributes: ["type", "status", "amount"],
    raw: true,
  });

  const sumWhere = (predicate) =>
    money(
      rows.filter(predicate).reduce((sum, row) => sum + money(row.amount), 0)
    );

  const isPayable = (row) => PAYABLE_TRANSACTION_TYPES.includes(row.type);
  const isSettled = (row) => SETTLED_STATUSES.includes(row.status);
  const isLive = (row) => !["REJECTED", "DRAFT"].includes(row.status);

  const byType = rows.reduce((acc, row) => {
    const key = row.type || "OTHER";
    if (!acc[key]) acc[key] = { count: 0, total: 0, settled: 0 };
    acc[key].count += 1;
    acc[key].total = money(acc[key].total + money(row.amount));
    if (isSettled(row)) acc[key].settled = money(acc[key].settled + money(row.amount));
    return acc;
  }, {});

  return {
    // company → agent
    commissionsDisbursed: sumWhere(
      (row) => row.type === "COMMISSION" && isSettled(row)
    ),
    commissionsPending: sumWhere(
      (row) => row.type === "COMMISSION" && isLive(row) && !isSettled(row)
    ),
    incentivesPaid: sumWhere((row) => row.type === "INCENTIVE" && isSettled(row)),
    advancesOutstanding: money(
      sumWhere((row) => row.type === "ADVANCE" && isSettled(row)) -
        sumWhere((row) => row.type === "ADVANCE_RECOVERY" && isSettled(row))
    ),
    // agent → company
    membershipCollected: sumWhere(
      (row) => row.type === "MEMBERSHIP_FEE" && isSettled(row)
    ),
    totalPayableSettled: sumWhere((row) => isPayable(row) && isSettled(row)),
    totalReceivableSettled: sumWhere(
      (row) => !isPayable(row) && isSettled(row)
    ),
    transactionCount: rows.length,
    byType,
  };
};

/**
 * Per-agent ledger balance: earned, paid, and what is still owed. Used by the
 * agent profile drawer's Finance tab.
 */
export const getAgentLedger = async (agentId) => {
  const agent = await Agent.findByPk(agentId, {
    attributes: [
      "id",
      "name",
      "phone",
      "membership_status",
      "membership_amount",
      "commission_earned",
      "commission_paid",
    ],
  });
  if (!agent) throw httpError("Agent not found", 404);

  const transactions = await listTransactions({ agentId });

  const earned = money(agent.commission_earned);
  const paid = money(agent.commission_paid);

  return {
    agent,
    outstanding: money(earned - paid),
    transactions,
  };
};
