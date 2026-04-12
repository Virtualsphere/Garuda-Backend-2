import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Availibility= sequelize.define("Availibility", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    land_id: {
        type: DataTypes.INTEGER
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    status: {
        type: DataTypes.ENUM('available', 'not available'),
        defaultValue: 'available'
    }
},{
  tableName: "availibility",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Availibility;