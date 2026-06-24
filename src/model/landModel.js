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
  nearest_town_1: {
    type: DataTypes.STRING
  },
  nearest_town_1_km: {
    type: DataTypes.BIGINT
  },
  nearest_town_2: {
    type: DataTypes.STRING
  },
  nearest_town_2_km: {
    type: DataTypes.BIGINT
  },
  nearest_town_3: {
    type: DataTypes.STRING
  },
  nearest_town_3_km: {
    type: DataTypes.BIGINT
  },
  trainee: {
    type: DataTypes.BOOLEAN
  },
  location_latitude: {
    type: DataTypes.TEXT
  },
  location_longitude:{
    type: DataTypes.TEXT
  },
  land_sale_available_status: {
    type: DataTypes.JSONB
  },
  mortage_availability_status: {
    type: DataTypes.JSONB
  },
  urgency_listing: {
    type: DataTypes.JSONB
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
  call_verification_by: {
    type: DataTypes.INTEGER
  },
  call_verification_status: {
    type: DataTypes.ENUM('complete', 'pending', 'rejected'),
    defaultValue: 'pending'
  },
  form_status: {
    type: DataTypes.ENUM('draft', 'complete', 'review'),
    defaultValue: 'complete'
  },
  physcial_verification_status: {
    type: DataTypes.ENUM('pending', 'complete'),
    defaultValue: 'pending'
  },
  verification_status: {
    type: DataTypes.ENUM('pending', 'complete'),
    defaultValue: "pending"
  },
  availablity: {
    type: DataTypes.ENUM('sold', 'available'),
    defaultValue: 'available'
  }
}, {
  tableName: "land",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Land;