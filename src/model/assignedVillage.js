import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const AssignedVillage= sequelize.define("AssignedVillage", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    target: {
        type: DataTypes.INTEGER
    },
    assigned_status: {
        type: DataTypes.ENUM('ongoing', 'completed'),
        defaultValue: 'ongoing'
    },
    listed: {
        type: DataTypes.INTEGER
    },
    assigned_employee_id: {
        type: DataTypes.INTEGER
    },
    village: {
        type: DataTypes.STRING
    },
    mandal: {
        type: DataTypes.STRING
    },
    land_created: {
        type: DataTypes.JSONB
    },
    complete_details: {
        type: DataTypes.JSONB
    },
    verified: {
        type: DataTypes.JSONB
    },
    physical_verified: {
        type: DataTypes.JSONB
    }
},{
  tableName: "assigned_village",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default AssignedVillage;