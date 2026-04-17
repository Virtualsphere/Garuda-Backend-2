import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const WorkWallet = sequelize.define("WorkWallet", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount_type: {
    type: DataTypes.ENUM("BASIC SALARY", "NEW LAND", "VERIFIED", "BUYER VISIT", "FILL DETAILS", "REFERAL")
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "COMPLETED"),
    defaultValue: "PENDING",
  },
}, {
  tableName: "work_wallet",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default WorkWallet;