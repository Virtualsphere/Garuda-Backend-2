import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const Village= sequelize.define("Village", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mandal_id: {
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Fallback map coordinates, seeded by src/scripts/backfillLocationCoords.js.
    // The centroid of a village's land GPS takes precedence; these only place
    // villages that have no land with coordinates yet.
    latitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true
    }
},{
  tableName: "village",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Village;