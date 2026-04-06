import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Village= sequelize.define("Village", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mandal_id: {
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
  tableName: "village",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Village;