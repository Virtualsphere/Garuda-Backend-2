import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const EnquiryPayment= sequelize.define("EnquiryPayment", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: DataTypes.DOUBLE
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid'),
        defaultValue: 'pending'
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    land_id: {
        type: DataTypes.INTEGER
    }
},{
  tableName: "enquiry_payment",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default EnquiryPayment;