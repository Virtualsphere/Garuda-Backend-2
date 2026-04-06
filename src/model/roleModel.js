import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Role= sequelize.define("Role", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
  tableName: "roles",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Role;