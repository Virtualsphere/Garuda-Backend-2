import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Shortlisting= sequelize.define("Shortlisting", {
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
  tableName: "shortlisting",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Shortlisting;