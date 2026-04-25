import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const PetrolAdvance = sequelize.define("PetrolAdvance", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DOUBLE, allowNull: false },
}, {
  tableName: "petrol_advance",
  timestamps: true,
  createdAt: "created_at",
});

export default PetrolAdvance;