import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Town= sequelize.define("Town", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    district_id: {
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
  tableName: "town",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Town;