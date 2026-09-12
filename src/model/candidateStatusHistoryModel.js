import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// Append-only log of every candidate pipeline transition. Written inside the
// same transaction as the status change so the two can never disagree.
const CandidateStatusHistory = sequelize.define(
  "CandidateStatusHistory",
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
    from_status: {
      type: DataTypes.STRING,
    },
    to_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "candidate_status_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ fields: ["candidate_id"] }],
  }
);

export default CandidateStatusHistory;
