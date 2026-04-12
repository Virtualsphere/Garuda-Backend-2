import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Agent= sequelize.define("Agent", {
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
    name: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    refered_by: {
        type: DataTypes.STRING
    }
},{
  tableName: "agent",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Agent;