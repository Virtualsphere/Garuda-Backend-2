import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const FarmerDetails = sequelize.define("FarmerDetails", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  land_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  whatsapp: {
    type: DataTypes.STRING
  },
  ownership_type: {
    type: DataTypes.ENUM('Ancestral', 'Purchased'),
    defaultValue: 'Ancestral'
  },
  locality: {
    type: DataTypes.ENUM('Local', 'Non-local')
  },
  ownership_status: {
    type: DataTypes.ENUM('Own', 'Joint')
  },
  age: {
    type: DataTypes.ENUM('Upto 30', '30-50', '50+')
  },
  literacy: {
    type: DataTypes.ENUM('Illiterate', 'Literate', 'High School', 'Graduate')
  },
  nature: {
    type: DataTypes.ENUM('Calm', 'Polite', 'Normal', 'Rude')
  },

}, {
  tableName: "farmer_details",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default FarmerDetails;