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
    },
    // Coarsest fallback: used when a village has neither land GPS nor its own
    // seeded coordinates. See src/scripts/backfillLocationCoords.js.
    latitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true
    }
},{
  tableName: "mandal",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Mandal;