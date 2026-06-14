import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandDetails = sequelize.define("LandDetails", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  land_id: {
    type: DataTypes.INTEGER
  },
  total_acres: {
    type: DataTypes.FLOAT
  },
  guntas: {
    type: DataTypes.FLOAT
  },
  price_per_acres: {
    type: DataTypes.FLOAT
  },
  total_value: {
    type: DataTypes.DOUBLE
  },
  nearest_road_type: {
    type: DataTypes.STRING
  },
  land_attached_to_road: {
    type: DataTypes.ENUM('yes', 'no')
  },
  path_ownership: {
    type: DataTypes.STRING
  },
  land_entry_latitude: {
    type: DataTypes.TEXT
  },
  land_entry_longitude: {
    type: DataTypes.TEXT
  },
  land_boundary_latitude: {
    type: DataTypes.TEXT
  },
  land_boundary_longitude: {
    type: DataTypes.TEXT
  },
  soil_type: {
    type: DataTypes.STRING,
  },
  fencing_status: {
    type: DataTypes.STRING
  },
  electricity: {
    type: DataTypes.JSONB
  },
  residence: {
    type: DataTypes.JSONB
  },
  poultry_shed_number: {
    type: DataTypes.INTEGER
  },
  cow_shed_number: {
    type: DataTypes.INTEGER
  },
  water_source: {
    type: DataTypes.JSONB
  },
  number_of_bores: {
    type: DataTypes.INTEGER
  },
  farm_pond: {
    type: DataTypes.BOOLEAN
  },
  complaints: {
    type: DataTypes.JSONB
  }
}, {
  tableName: "land_details",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandDetails;