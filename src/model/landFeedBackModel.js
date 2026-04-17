import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandFeedBack= sequelize.define("LandFeedBack", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    buyer_aggrement: {
        type: DataTypes.TEXT
    },
    land_feedback: {
        type: DataTypes.TEXT
    }
},{
  tableName: "land_feedback",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandFeedBack;