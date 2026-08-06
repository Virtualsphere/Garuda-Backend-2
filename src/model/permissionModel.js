import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Permission = sequelize.define("Permission", {
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
    label: {
        type: DataTypes.STRING,
        allowNull: false
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
},{
  tableName: "permissions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Permission;
