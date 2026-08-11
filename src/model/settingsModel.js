import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Setting = sequelize.define("Setting", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.JSONB,
        allowNull: false
    }
},{
  tableName: "settings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Setting;
