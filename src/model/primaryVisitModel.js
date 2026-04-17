import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const PrimaryVisit= sequelize.define("PrimaryVisit", {
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
    user_id: {
        type: DataTypes.INTEGER
    },
    visit_date: {
        type: DataTypes.DATE
    },
    time: {
        type: DataTypes.TIME
    },
    meeting_status: {
        type: DataTypes.ENUM('Scheduled', 'Complete', 'Cancelled', 'Postponed'),
        defaultValue: 'Scheduled'
    },
    land_visit_photos: {
        type: DataTypes.JSONB
    },
    fee_receipt: {
        type: DataTypes.JSONB
    },
    buyer_visit: {
        type: DataTypes.JSONB
    }
},{
  tableName: "primary_visit",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default PrimaryVisit;