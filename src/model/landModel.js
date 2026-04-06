import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Land = sequelize.define("Land", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  state: {
    type: DataTypes.STRING
  },
  district: {
    type: DataTypes.STRING
  },
  mandal: {
    type: DataTypes.STRING
  },
  village: {
    type: DataTypes.STRING
  },
  location_latitude: {
    type: DataTypes.STRING
  },
  location_longitude:{
    type: DataTypes.STRING
  },
  land_status: {
    type: DataTypes.ARRAY(
      DataTypes.ENUM(
        "AVAILABLE FOR MORTGAGE",
        "MORTGAGED",
        "AVAILABLE FOR SALE",
        "TOKEN",
        "AGREEMENT",
        "SOLD"
      )
    ),
    allowNull: false,
  },
  urgency_listing: {
    type: DataTypes.ARRAY(
      DataTypes.ENUM(
        "urgent sale",
        "premium listing"
      )
    ),
    allowNull: false,
  },
  verification_package: {
    type: DataTypes.BOOLEAN
  },
  created_by: {
    type: DataTypes.INTEGER,
  },
  verified_by: {
    type: DataTypes.INTEGER,
  },
  form_status: {
    type: DataTypes.ENUM('draft', 'complete', 'review'),
    defaultValue: 'complete'
  }
}, {
  tableName: "land",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Land;