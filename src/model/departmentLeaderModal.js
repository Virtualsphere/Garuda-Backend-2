import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const DepartmentLeader= sequelize.define("DepartmentLeader", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    leader_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    department_type: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
  tableName: "department_leaders",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    {
      unique: true,
      fields: ["employee_id", "department_type"],
    },
  ],
});

export default DepartmentLeader;
