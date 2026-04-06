import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const RefreshToken = sequelize.define("RefreshToken", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  user_id: {
    type: DataTypes.INTEGER,
  },

  role: {
    type: DataTypes.STRING,
  },

  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  expiry_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },

}, {
  tableName: "refresh_tokens",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default RefreshToken;