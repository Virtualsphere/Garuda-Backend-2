import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandGPS = sequelize.define("LandGPS", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  land_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  latitude: DataTypes.TEXT,
  longitude: DataTypes.TEXT,

}, {
  tableName: "land_gps",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandGPS;