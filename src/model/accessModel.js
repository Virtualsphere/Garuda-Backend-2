import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Access= sequelize.define("Access", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    app_type: {
        type: DataTypes.ENUM('field', 'agent', 'admin')
    },
    role: {
        type: DataTypes.STRING
    }
},{
  tableName: "access",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Access;