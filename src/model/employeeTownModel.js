import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const EmployeeTown= sequelize.define("EmployeeTown", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER
    },
    town1: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    town2: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    town3: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
  tableName: "employee_town",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default EmployeeTown;