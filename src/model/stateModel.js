import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const State= sequelize.define("State", {
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
  tableName: "state",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default State;