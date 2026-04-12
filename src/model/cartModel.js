import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Cart= sequelize.define("Cart", {
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
    }
},{
  tableName: "cart",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Cart;