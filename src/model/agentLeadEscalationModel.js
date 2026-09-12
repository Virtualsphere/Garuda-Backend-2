import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// A telecaller handing a lead up to their team leader — the Team Leader tab's
// queue. One row per escalation, so a lead bounced twice keeps both records.
export const ESCALATION_STATUSES = [
  "Pending",
  "Completed",
  "ReturnedToTelecaller",
];

const AgentLeadEscalation = sequelize.define(
  "AgentLeadEscalation",
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

    // ── Raised by the telecaller ───────────────────────────────────
    telecaller_id: { type: DataTypes.INTEGER },
    telecaller_note: { type: DataTypes.TEXT },
    call_recording_url: { type: DataTypes.STRING },
    call_duration: { type: DataTypes.STRING },
    call_datetime: { type: DataTypes.DATE },
    forwarded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    // ── Worked by the team leader ──────────────────────────────────
    team_leader_id: { type: DataTypes.INTEGER },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
      validate: { isIn: [ESCALATION_STATUSES] },
    },
    tl_note: { type: DataTypes.TEXT },
    tl_recording_url: { type: DataTypes.STRING },
    tl_result: { type: DataTypes.STRING },
    completed_at: { type: DataTypes.DATE },
  },
  {
    tableName: "agent_lead_escalation",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["candidate_id"] },
      { fields: ["team_leader_id"] },
      { fields: ["status"] },
    ],
  }
);

export default AgentLeadEscalation;
