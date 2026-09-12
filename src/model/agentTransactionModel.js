import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// Money moving between the company and an agent. `agent.commission_earned` /
// `commission_paid` stay as running totals; this table is the ledger they are
// derived from, so a payout can be audited line by line.
export const AGENT_TRANSACTION_TYPES = [
  "MEMBERSHIP_FEE",      // onboarding kit / membership collected FROM the agent
  "COMMISSION",          // commission owed TO the agent on a closed deal
  "INCENTIVE",           // discretionary bonus
  "ADVANCE",             // money paid out ahead of earnings
  "ADVANCE_RECOVERY",    // advance being recovered from a later payout
  "PENALTY",             // deduction
  "REFUND",
  "OTHER",
];

// Types where money flows company → agent. Everything else flows agent →
// company, which is what the ledger's running balance keys off.
export const PAYABLE_TRANSACTION_TYPES = [
  "COMMISSION",
  "INCENTIVE",
  "ADVANCE",
  "REFUND",
];

export const AGENT_TRANSACTION_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "PAID",
  "PARTIAL",
  "REJECTED",
  "REFUNDED",
];

export const AGENT_PAYMENT_MODES = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CHEQUE",
  "ADJUSTMENT",
];

const AgentTransaction = sequelize.define(
  "AgentTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Human-facing reference (TXN-000123), filled in after insert.
    transaction_code: {
      type: DataTypes.STRING,
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [AGENT_TRANSACTION_TYPES] },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "PENDING",
      validate: { isIn: [AGENT_TRANSACTION_STATUSES] },
    },
    payment_mode: {
      type: DataTypes.STRING,
      validate: { isIn: [AGENT_PAYMENT_MODES] },
    },
    reference_no: { type: DataTypes.STRING },

    // Optional provenance — which land the commission arose from.
    land_id: { type: DataTypes.INTEGER },

    transaction_date: { type: DataTypes.DATEONLY },
    notes: { type: DataTypes.TEXT },
    receipt_url: { type: DataTypes.STRING },

    created_by: { type: DataTypes.INTEGER },
    approved_by: { type: DataTypes.INTEGER },
    approved_at: { type: DataTypes.DATE },
  },
  {
    tableName: "agent_transaction",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["agent_id"] },
      { fields: ["status"] },
      { fields: ["type"] },
    ],
  }
);

export default AgentTransaction;
