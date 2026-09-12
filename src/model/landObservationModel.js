import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// Secondary ("observation") attachment of an agent to a land parcel.
// land.agent_id remains the single primary link; these rows let several
// agents observe the same parcel, which drives the map's heatmap tone.
//
// A row is also a standing *assignment*: it carries how often the agent is
// expected to report back and when the next report is due, which is what the
// allotment map renders as a pulsing "information due" target.
export const OBSERVATION_FREQUENCIES = [
  "ONE_TIME",
  "WEEKLY",
  "15_DAYS",
  "MONTHLY",
  "ON_REQUEST",
];

export const OBSERVATION_STATUSES = [
  "ACTIVE",
  "INFORMATION_DUE",
  "UPDATE_SUBMITTED",
  "VERIFICATION_PENDING",
  "UPDATED",
  "UNABLE_TO_VERIFY",
  "CLOSED",
];

// How many days each frequency adds when the next due date is rolled forward.
// ONE_TIME and ON_REQUEST have no automatic next date.
export const FREQUENCY_DAYS = {
  WEEKLY: 7,
  "15_DAYS": 15,
  MONTHLY: 30,
};

const LandObservation = sequelize.define(
  "LandObservation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    land_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ── Standing assignment ────────────────────────────────────────
    // All nullable with defaults so rows written before this existed
    // stay valid and simply read as an ACTIVE one-time observation.
    frequency: {
      type: DataTypes.STRING,
      defaultValue: "ONE_TIME",
      validate: { isIn: [OBSERVATION_FREQUENCIES] },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "ACTIVE",
      validate: { isIn: [OBSERVATION_STATUSES] },
    },
    next_due_date: { type: DataTypes.DATEONLY },
    last_submitted_at: { type: DataTypes.DATE },
    notes: { type: DataTypes.TEXT },
    assigned_by: { type: DataTypes.INTEGER },
  },
  {
    tableName: "land_observation",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["land_id", "agent_id"] },
      { fields: ["next_due_date"] },
      { fields: ["status"] },
    ],
  }
);

export default LandObservation;
