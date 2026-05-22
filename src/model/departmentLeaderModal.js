import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const DepartmentLeader= sequelize.define("DepartmentLeader", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    leader_id: {
        type: DataTypes.INTEGER
    },
    department_type: {
        type: String
    }
},{
  tableName: "cart",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default DepartmentLeader;