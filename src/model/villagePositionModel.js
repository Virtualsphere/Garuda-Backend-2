import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// A numbered agent seat in a village.
//
// Capacity itself is NOT stored here — how many agents a village needs is
// derived from the `required_agents_slabs` setting against its acreage, so
// there is exactly one source of truth for that number. These rows track the
// named seats and where each one is in the hiring pipeline.
export const POSITION_STATUSES = [
  "VACANT",
  "NATIVE_SEARCH",
  "WAITING_CANDIDATES_AVAILABLE",
  "OPEN_TO_WAITING_CANDIDATES",
  "CANDIDATE_SELECTED",
  "JOINING",
  "FILLED",
];

// Seats in these states are still open to a new selection.
export const OPEN_POSITION_STATUSES = [
  "VACANT",
  "NATIVE_SEARCH",
  "WAITING_CANDIDATES_AVAILABLE",
  "OPEN_TO_WAITING_CANDIDATES",
];

const VillagePosition = sequelize.define(
  "VillagePosition",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    position_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    state: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    mandal: { type: DataTypes.STRING },
    village: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "VACANT",
      validate: { isIn: [POSITION_STATUSES] },
    },
    // Filled seat
    agent_id: { type: DataTypes.INTEGER },
    // Seat with a candidate chosen but not yet appointed
    selected_candidate_id: { type: DataTypes.INTEGER },
    is_native: { type: DataTypes.BOOLEAN },

    // Native-priority release audit
    opened_to_waiting_at: { type: DataTypes.DATE },
    opened_by: { type: DataTypes.INTEGER },
    opened_remarks: { type: DataTypes.TEXT },
  },
  {
    tableName: "village_agent_position",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["village"] },
      { fields: ["status"] },
      { unique: true, fields: ["village", "mandal", "position_number"] },
    ],
  }
);

export default VillagePosition;
