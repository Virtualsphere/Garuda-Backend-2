import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const SessionExpense = sequelize.define("SessionExpense", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  session_id: {
    type: DataTypes.INTEGER,
  },
  type: {
    type: DataTypes.ENUM("BUS", "OTHER"),
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  description: {
    type: DataTypes.TEXT,
  },
  photo: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "session_expense",
  timestamps: true,
  createdAt: "created_at",
});

export default SessionExpense;