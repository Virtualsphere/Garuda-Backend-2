import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";
import {
  CALL_ANSWER_STATUSES,
  CALL_RESULTS,
} from "./agentCandidateModel.js";

// One dial against an agent lead. The candidate row carries the *latest*
// outcome denormalised so a lead list needs no join; this table is the full
// history behind it, and is what the Calls tab's attempt counters read.
const AgentCallAttempt = sequelize.define(
  "AgentCallAttempt",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    candidate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Which queue the dial came from, so "first call" vs "follow-up" vs
    // "not lifted retry" stays answerable after the fact.
    queue: {
      type: DataTypes.STRING,
      defaultValue: "first-call",
      validate: { isIn: [["first-call", "follow-up", "not-lifted", "tl"]] },
    },

    answer_status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [CALL_ANSWER_STATUSES] },
    },
    result: {
      type: DataTypes.STRING,
      validate: { isIn: [CALL_RESULTS] },
    },
    note: { type: DataTypes.TEXT },

    recording_url: { type: DataTypes.STRING },
    duration_seconds: { type: DataTypes.INTEGER },

    // Who dialled. Null when the call arrived from the IVR unattributed.
    employee_id: { type: DataTypes.INTEGER },

    called_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "agent_call_attempt",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["candidate_id"] },
      { fields: ["employee_id"] },
      { fields: ["answer_status"] },
    ],
  }
);

export default AgentCallAttempt;
