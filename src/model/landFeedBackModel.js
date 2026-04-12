import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandFeedBack= sequelize.define("LandFeedBack", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    land_id: {
        type: DataTypes.INTEGER
    },
    employee_id: {
        type: DataTypes.INTEGER
    },
    feedback: {
        type: DataTypes.TEXT
    }
},{
  tableName: "land_feedback",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandFeedBack;