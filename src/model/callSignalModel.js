import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const CallSignal = sequelize.define("CallSignal", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    department_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    direction: {
        type: DataTypes.ENUM('inbound', 'outbound'),
        defaultValue: 'outbound'
    },
    caller_name: {
        type: DataTypes.STRING
    },
    caller_phone: {
        type: DataTypes.STRING
    },
    caller_type: {
        type: DataTypes.STRING
    },
    mission_context: {
        type: DataTypes.STRING,
        allowNull: true
    },
    land_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    missed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
},{
  tableName: "call_signals",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default CallSignal;
