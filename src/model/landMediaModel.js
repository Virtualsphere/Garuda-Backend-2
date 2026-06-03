import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandMedia = sequelize.define("LandMedia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  land_id: {
    type: DataTypes.INTEGER
  },

  category: {
    type: DataTypes.ENUM(
      "default",
      "card",
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
      "farmer_aggrement",
      "others",
      "video",
      "card"
    )
  },

  type: {
    type: DataTypes.ENUM("image", "video")
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