import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandMedia = sequelize.define("LandMedia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  land_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  category: {
    type: DataTypes.ENUM(
      "default",
      "farmer_photo",
      "land_soil",
      "fencing",
      "farm_pond",
      "residence",
      "shed",
      "water_source",
      "trees",
      "rocks",
      "electric_poles",
      "others",
      "video"
    ),
    allowNull: false
  },

  type: {
    type: DataTypes.ENUM("image", "video"),
    allowNull: false
  },

  url: {
    type: DataTypes.TEXT,
    allowNull: false
  }

}, {
  tableName: "land_media",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandMedia;