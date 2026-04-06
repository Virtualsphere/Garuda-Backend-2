import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Mandal= sequelize.define("Mandal", {
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
  tableName: "mandal",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Mandal;