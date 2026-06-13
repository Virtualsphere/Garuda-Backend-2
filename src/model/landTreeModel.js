import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandTree = sequelize.define("LandTree", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  land_id: {
    type: DataTypes.INTEGER
  },
  type: {
    type: DataTypes.STRING
  },
  count: {
    type: DataTypes.BIGINT
  }
}, {
  tableName: "land_tree",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandTree;