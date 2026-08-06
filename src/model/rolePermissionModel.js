import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const RolePermission = sequelize.define("RolePermission", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},{
  tableName: "role_permissions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { unique: true, fields: ["role_name", "permission_id"] }
  ]
});

export default RolePermission;
