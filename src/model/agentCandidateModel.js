import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// A recruit moving through the agent hiring pipeline. Distinct from `agent`:
// a candidate only becomes a row in `agent` once they are appointed to a
// village seat (see recruitmentService.convertCandidateToAgent).
export const CANDIDATE_STATUSES = [
  "NEW_LEAD",
  "FIRST_CALL",
  "INTERESTED",
  "LOCATION_CHECK",
  "VILLAGE_INTEREST",
  "WAITING",
  "SELECTED",
  "OFFICE_VISIT",
  "JOINING_PROCESS",
  "JOINED",
  // terminal
  "NOT_INTERESTED",
  "NOT_RESPONDING",
  "NOT_ELIGIBLE",
  "REJECTED",
  "DUPLICATE",
  "WITHDRAWN",
  // Handed to another department; this desk is done with them.
  "DIVERTED",
];

// Statuses past which a candidate is no longer actively progressing.
export const TERMINAL_CANDIDATE_STATUSES = [
  "NOT_INTERESTED",
  "NOT_RESPONDING",
  "NOT_ELIGIBLE",
  "REJECTED",
  "DUPLICATE",
  "WITHDRAWN",
  "DIVERTED",
];

// What happened on the last dial. Recorded per attempt in agent_call_attempt
// too; this is the denormalised "latest" so a lead list needs no join.
export const CALL_ANSWER_STATUSES = [
  "Answered",
  "Not Lifted",
  "No Answer",
  "Busy / Call Later",
  "Invalid Number",
];

// What the caller decided after speaking to them.
export const CALL_RESULTS = ["Proceed", "Follow Up", "Not Interested", "Divert"];

export const CANDIDATE_TYPES = [
  "NATIVE",
  "OUTSIDE_VILLAGE",
  "MULTIPLE_VILLAGE",
];

const AgentCandidate = sequelize.define(
  "AgentCandidate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alternate_phone: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    // Home location. `village` is what makes an interest "native".
    state: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    mandal: { type: DataTypes.STRING },
    village: { type: DataTypes.STRING },

    lead_source: {
      type: DataTypes.STRING,
      defaultValue: "DIRECT",
    },
    candidate_type: {
      type: DataTypes.STRING,
      defaultValue: "NATIVE",
      validate: { isIn: [CANDIDATE_TYPES] },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NEW_LEAD",
      validate: { isIn: [CANDIDATE_STATUSES] },
    },
    // Last call outcome, kept loose because dispositions change often.
    call_status: {
      type: DataTypes.STRING,
    },
    assigned_employee_id: {
      type: DataTypes.INTEGER,
    },
    team_leader_id: {
      type: DataTypes.INTEGER,
    },
    // Set once the candidate is appointed; links back to the created agent row.
    converted_agent_id: {
      type: DataTypes.INTEGER,
    },
    selected_village: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    created_by: {
      type: DataTypes.INTEGER,
    },

    // ── Lead working state ─────────────────────────────────────────
    // Added for the recruitment desk's Leads / Calls / Allot queues. All
    // nullable with defaults so rows written before this stay valid.
    photo: { type: DataTypes.STRING },

    call_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_call_status: {
      type: DataTypes.STRING,
      validate: { isIn: [CALL_ANSWER_STATUSES] },
    },
    last_call_note: { type: DataTypes.TEXT },
    last_attempt_at: { type: DataTypes.DATE },
    last_attempt_by: { type: DataTypes.INTEGER },

    // A promised call-back. The Calls tab's "follow-ups" queue is everything
    // whose follow_up_date has arrived.
    follow_up_date: { type: DataTypes.DATEONLY },
    follow_up_time: { type: DataTypes.STRING },
    follow_up_by: { type: DataTypes.INTEGER },

    // Where a diverted lead went. Recorded rather than implied, because the
    // desk needs to answer "who has this candidate now" months later.
    diverted_to_department: { type: DataTypes.STRING },
    diverted_at: { type: DataTypes.DATE },
    diverted_by: { type: DataTypes.INTEGER },

    // ── Allotment ──────────────────────────────────────────────────
    // A lead is "unallotted" until it has a telecaller; that queue is what the
    // Allot Leads tab works through.
    assigned_team_id: { type: DataTypes.INTEGER },
    assigned_team_name: { type: DataTypes.STRING },
    allotted_at: { type: DataTypes.DATE },

    // Who referred them in, when the lead came from an existing agent.
    referring_agent_id: { type: DataTypes.INTEGER },
  },
  {
    tableName: "agent_candidate",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["phone"] },
      { fields: ["status"] },
      { fields: ["village"] },
    ],
  }
);

export default AgentCandidate;
