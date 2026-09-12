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
    buyer_code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    executive_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    },
    reset_token: {
        type: DataTypes.STRING,
        },
    reset_token_expiry: {
        type: DataTypes.DATE,
    },
    otp_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },

    // What the desk captures when a buyer enquires, before any shortlist
    // exists. Free text on purpose: a buyer says "50L to 1Cr" or "2 to 5
    // acres", and forcing that into numbers loses the range they actually
    // gave.
    budget_range: { type: DataTypes.STRING },
    required_extent: { type: DataTypes.STRING },
    preferred_location: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
},{
  tableName: "buyers",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Buyer;