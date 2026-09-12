import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// One report filed by an agent against a standing observation: what they found
// on the ground this cycle. Each submission is an immutable record — rolling
// the observation's next due date forward is the observation row's job.
export const YES_NO_UNSURE = [["YES", "NO", "NOT_SURE"]];
export const YES_NO_UNKNOWN = [["YES", "NO", "UNKNOWN"]];

export const PRICE_CHANGE_STATUSES = [["NO_CHANGE", "INCREASED", "DECREASED"]];

export const SUBMISSION_VERIFICATION_STATUSES = [
  ["PENDING", "APPROVED", "REJECTED"],
];

const LandObservationSubmission = sequelize.define(
  "LandObservationSubmission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    observation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    land_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ── What the agent found ───────────────────────────────────────
    is_available: {
      type: DataTypes.STRING,
      defaultValue: "NOT_SURE",
      validate: { isIn: YES_NO_UNSURE },
    },
    owner_willing_to_sell: {
      type: DataTypes.STRING,
      defaultValue: "NEED_CONFIRMATION",
      validate: { isIn: [["YES", "NO", "NEED_CONFIRMATION"]] },
    },
    reported_price_per_acre: { type: DataTypes.DECIMAL(14, 2) },
    // Snapshot of what the price was when the report was filed, so the
    // change can still be read back after the land record moves on.
    previous_price_per_acre: { type: DataTypes.DECIMAL(14, 2) },
    verified_price_per_acre: { type: DataTypes.DECIMAL(14, 2) },
    price_change_status: {
      type: DataTypes.STRING,
      defaultValue: "NO_CHANGE",
      validate: { isIn: PRICE_CHANGE_STATUSES },
    },

    buyer_activity: {
      type: DataTypes.STRING,
      defaultValue: "UNKNOWN",
      validate: { isIn: YES_NO_UNKNOWN },
    },
    land_sold: {
      type: DataTypes.STRING,
      defaultValue: "NO",
      validate: { isIn: [["YES", "NO", "HEARD_LOCALLY", "NEEDS_VERIFICATION"]] },
    },
    agreement_made: {
      type: DataTypes.STRING,
      defaultValue: "UNKNOWN",
      validate: { isIn: YES_NO_UNKNOWN },
    },
    condition_change: {
      type: DataTypes.STRING,
      defaultValue: "NO_CHANGE",
      validate: { isIn: [["NO_CHANGE", "CHANGE_OBSERVED"]] },
    },
    local_issue: {
      type: DataTypes.STRING,
      defaultValue: "NO",
      validate: { isIn: [["YES", "NO"]] },
    },

    remarks: { type: DataTypes.TEXT },
    // Stored as a JSON array of public URLs written by the upload route.
    photos: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    gps_latitude: { type: DataTypes.STRING },
    gps_longitude: { type: DataTypes.STRING },

    // ── Desk verification ──────────────────────────────────────────
    verification_status: {
      type: DataTypes.STRING,
      defaultValue: "PENDING",
      validate: { isIn: SUBMISSION_VERIFICATION_STATUSES },
    },
    verified_by: { type: DataTypes.INTEGER },
    verified_at: { type: DataTypes.DATE },
  },
  {
    tableName: "land_observation_submission",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["observation_id"] },
      { fields: ["land_id"] },
      { fields: ["agent_id"] },
      { fields: ["verification_status"] },
    ],
  }
);

export default LandObservationSubmission;
