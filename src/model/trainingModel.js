import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Training= sequelize.define("Training", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    land_verification: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    new_land_entry: {
        type: DataTypes.STRING
    },
    buyer_visit_assistant: {
        type: DataTypes.STRING
    },
    session_management: {
        type: DataTypes.STRING
    },
    path_logging: {
        type: DataTypes.STRING
    },
    wallet_features: {
        type: DataTypes.STRING
    },
    profile_settings: {
        type: DataTypes.STRING
    },
},{
  tableName: "training",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Training;