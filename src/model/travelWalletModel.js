import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const TravelWallet = sequelize.define("TravelWallet", {
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
    type: DataTypes.ENUM("PETROL ADVANCE", "PETROL CHARGES", "BUS TICKET", "OTHER EXPENSES")
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  description: {
    type: DataTypes.TEXT
  },
}, {
  tableName: "travel_wallet",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default TravelWallet;