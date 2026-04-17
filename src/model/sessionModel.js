import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Session = sequelize.define("Session", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  start_km: {
    type: DataTypes.INTEGER,
  },
  end_km: {
    type: DataTypes.INTEGER,
  },
  session_start_time: {
    type: DataTypes.DATE,
  },
  session_end_time: {
    type: DataTypes.DATE,
  },
  start_photo: {
    type: DataTypes.JSONB,
  },
  end_photo: {
    type: DataTypes.JSONB,
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "COMPLETED"),
    defaultValue: "ACTIVE",
  },
}, {
  tableName: "session",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Session;