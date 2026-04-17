import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Path = sequelize.define("Path", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  path_type: {
    type: DataTypes.ENUM("HIGHWAY", "DOUBLE ROAD", "SINGLE ROAD", "GRAVEL ROAD", "CAR ROAD", "TRACTOR ROAD", "BIKE ROAD", "FOOT PATH")
  },
  path: {
    type: DataTypes.STRING,
  },
  photo: {
    type: DataTypes.JSONB
  }
}, {
  tableName: "path",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Path;