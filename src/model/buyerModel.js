import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Buyer= sequelize.define("Buyer", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING
    },
    photo: {
        type: DataTypes.STRING
    }
},{
  tableName: "buyers",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Buyer;