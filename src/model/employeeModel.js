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
    photo: {
        type: DataTypes.TEXT
    },
    gender: {
        type: DataTypes.STRING
    },
    date_of_birth: {
        type: DataTypes.DATEONLY
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'DEACTIVE', 'TRAINEE'),
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
    house_no: {
        type: DataTypes.STRING
    },
    colony: {
        type: DataTypes.STRING
    },
    home_village: {
        type: DataTypes.STRING
    },
    home_mandal: {
        type: DataTypes.STRING
    },
    home_town: {
        type: DataTypes.STRING
    },
    home_district: {
        type: DataTypes.STRING
    },
    shirt_size: {
        type: DataTypes.STRING
    },
    assigned_hub: {
        type: DataTypes.STRING
    },
    contract_start_date: {
        type: DataTypes.DATEONLY
    },
    contract_end_date: {
        type: DataTypes.DATEONLY
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
    new_land_price: {
        type: DataTypes.DOUBLE
    },
    verification_price: {
        type: DataTypes.DOUBLE
    },
    buyer_visit_price: {
        type: DataTypes.DOUBLE
    },
    referal_price: {
        type: DataTypes.DOUBLE
    },
},{
  tableName: "employees",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Employee;