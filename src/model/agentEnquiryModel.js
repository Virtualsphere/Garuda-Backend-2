import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// An inbound enquiry handled by the agents desk: somebody rings in asking to
// become an agent, about a village vacancy, or for support on an existing
// posting. Distinct from `agent_candidate` — an enquiry only becomes a
// candidate once the desk decides it is a real lead (see convertToCandidate).
export const ENQUIRY_CALLER_TYPES = [
  "NEW_CANDIDATE",
  "EXISTING_CANDIDATE",
  "EXISTING_AGENT",
  "UNKNOWN",
];

export const ENQUIRY_TYPES = [
  "BECOME_AGENT",
  "VILLAGE_VACANCY",
  "INTERESTED_VILLAGE",
  "JOINING",
  "AGENT_SUPPORT",
  "OTHER",
];

export const ENQUIRY_STATUSES = [
  "NEW",
  "CALLBACK_PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CONVERTED_TO_LEAD",
  "CLOSED",
];

// Statuses past which an enquiry is no longer actively worked.
export const TERMINAL_ENQUIRY_STATUSES = ["RESOLVED", "CONVERTED_TO_LEAD", "CLOSED"];

const AgentEnquiry = sequelize.define(
  "AgentEnquiry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Human-facing reference (ENQ-000123), filled in by the service after
    // insert so it can embed the generated id.
    enquiry_code: {
      type: DataTypes.STRING,
    },
    caller_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caller_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caller_type: {
      type: DataTypes.STRING,
      defaultValue: "NEW_CANDIDATE",
      validate: { isIn: [ENQUIRY_CALLER_TYPES] },
    },
    enquiry_type: {
      type: DataTypes.STRING,
      defaultValue: "BECOME_AGENT",
      validate: { isIn: [ENQUIRY_TYPES] },
    },

    state: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    mandal: { type: DataTypes.STRING },
    village: { type: DataTypes.STRING },
    // Where the caller actually wants to work, when that differs from where
    // they live — the map reads this for the "waiting outside" layer.
    preferred_village: { type: DataTypes.STRING },

    status: {
      type: DataTypes.STRING,
      defaultValue: "NEW",
      validate: { isIn: [ENQUIRY_STATUSES] },
    },
    notes: { type: DataTypes.TEXT },

    // Telecaller who took the call.
    assigned_employee_id: { type: DataTypes.INTEGER },

    // When a phone match is found against an existing record, the desk sees it
    // rather than creating a duplicate lead.
    matched_record_type: {
      type: DataTypes.STRING,
      validate: { isIn: [["AGENT_CANDIDATE", "MASTER_AGENT"]] },
    },
    matched_record_id: { type: DataTypes.INTEGER },

    // Set once the enquiry is promoted into the recruitment pipeline.
    converted_candidate_id: { type: DataTypes.INTEGER },

    callback_at: { type: DataTypes.DATE },
    resolved_at: { type: DataTypes.DATE },
  },
  {
    tableName: "agent_enquiry",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["caller_phone"] },
      { fields: ["status"] },
      { fields: ["village"] },
    ],
  }
);

export default AgentEnquiry;
