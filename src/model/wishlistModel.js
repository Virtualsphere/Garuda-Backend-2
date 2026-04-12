import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const WishList = sequelize.define("WishList", {
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
}, {
  tableName: "wish_list",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default WishList;