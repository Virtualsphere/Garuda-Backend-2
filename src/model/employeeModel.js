import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Employee= sequelize.define("Employee", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    secondary_role: {
        type: DataTypes.JSONB
    },
    email: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    other_phone: {
        type: DataTypes.STRING
    },
    blood_group: {
        type: DataTypes.STRING
    },
    about: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'DEACTIVE'),
        defaultValue: 'ACTIVE'
    },
    aadhar_number: {
        type: DataTypes.STRING
    },
    aadhar_photo: {
        type: DataTypes.STRING
    },
    bank_name: {
        type: DataTypes.STRING
    },
    account_number: {
        type: DataTypes.STRING
    },
    ifsc_code: {
        type: DataTypes.STRING
    },
    phone_pe_number: {
        type: DataTypes.STRING
    },
    google_pay_number: {
        type: DataTypes.STRING
    },
    upi_id: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.TEXT
    },
    shirt_size: {
        type: DataTypes.STRING
    },
    work_state: {
        type: DataTypes.STRING
    },
    work_district: {
        type: DataTypes.JSONB
    },
    work_mandal: {
        type: DataTypes.JSONB
    },
    work_village: {
        type: DataTypes.JSONB
    },
    salary_package: {
        type: DataTypes.STRING
    }
},{
  tableName: "employees",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Employee;