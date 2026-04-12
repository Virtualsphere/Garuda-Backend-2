import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Payment= sequelize.define("Payment", {
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
  tableName: "payment",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Payment;