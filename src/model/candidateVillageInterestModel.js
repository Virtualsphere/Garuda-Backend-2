import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// Candidate ↔ village, many-to-many. One candidate may register interest in
// several villages; `is_native` is computed on write from the candidate's home
// village and is what drives native-priority ordering.
export const INTEREST_STATUSES = [
  "INTERESTED",
  "NATIVE_PRIORITY_WAIT",
  "WAITING",
  "VACANCY_AVAILABLE",
  "UNDER_REVIEW",
  "SELECTED",
  "JOINING",
  "JOINED",
  "WITHDRAWN",
  "REJECTED",
];

const CandidateVillageInterest = sequelize.define(
  "CandidateVillageInterest",
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
    state: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    mandal: { type: DataTypes.STRING },
    village: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Never trusted from the client — always derived server-side.
    is_native: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "INTERESTED",
      validate: { isIn: [INTEREST_STATUSES] },
    },
    interested_since: {
      type: DataTypes.DATEONLY,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "candidate_village_interest",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["village"] },
      { fields: ["status"] },
      { unique: true, fields: ["candidate_id", "village"] },
    ],
  }
);

export default CandidateVillageInterest;
