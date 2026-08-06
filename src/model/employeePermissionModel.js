import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const EmployeePermission = sequelize.define("EmployeePermission", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM("ALLOW", "DENY"),
        allowNull: false
    }
},{
  tableName: "employee_permissions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { unique: true, fields: ["employee_id", "permission_id"] }
  ]
});

export default EmployeePermission;
