import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// An interested candidate booked in to a regional office — the step between
// "Interested" and actually being onboarded as an agent. The Onboarding tab is
// this table grouped by day.
export const OFFICE_VISIT_STATUSES = ["Scheduled", "Completed", "Cancelled"];

const AgentOfficeVisit = sequelize.define(
  "AgentOfficeVisit",
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

    regional_office: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // Kept as a string ("10:30 AM") rather than TIME — it is a slot label the
    // desk agrees with the candidate, not a precise instant.
    visit_time: { type: DataTypes.STRING },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Scheduled",
      validate: { isIn: [OFFICE_VISIT_STATUSES] },
    },

    // Which village seat they are coming in to be attached to.
    interested_village: { type: DataTypes.STRING },

    assigned_employee_id: { type: DataTypes.INTEGER },
    notes: { type: DataTypes.TEXT },

    completed_at: { type: DataTypes.DATE },
    cancelled_reason: { type: DataTypes.TEXT },
  },
  {
    tableName: "agent_office_visit",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["candidate_id"] },
      { fields: ["visit_date"] },
      { fields: ["status"] },
    ],
  }
);

export default AgentOfficeVisit;
