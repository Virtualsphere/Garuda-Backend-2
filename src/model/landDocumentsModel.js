import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandDocuments = sequelize.define("LandDocuments", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  land_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  doc_type: {
    type: DataTypes.ENUM(
      "PASSBOOK",
      "AADHAR",
      "TITLE_DEED"
    ),
    allowNull: false
  },

  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  }

}, {
  tableName: "land_documents",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandDocuments;