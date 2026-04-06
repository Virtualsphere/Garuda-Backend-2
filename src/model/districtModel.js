import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const District= sequelize.define("District", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    state_id: {
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
  tableName: "district",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default District;