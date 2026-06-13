import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandShedDimensions = sequelize.define("LandShedDimensions", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  land_id: {
    type: DataTypes.INTEGER
  },
  poultry_shed_length: {
    type: DataTypes.BIGINT
  },
  poultry_shed_width: {
    type: DataTypes.BIGINT
  },
  cow_shed_length: {
    type: DataTypes.BIGINT
  },
  cow_shed_width: {
    type: DataTypes.BIGINT
  }
}, {
  tableName: "land_shed_Dimensions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandShedDimensions;