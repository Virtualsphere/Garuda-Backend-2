import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// Secondary ("observation") attachment of an agent to a land parcel.
// land.agent_id remains the single primary link; these rows let several
// agents observe the same parcel, which drives the map's heatmap tone.
const LandObservation = sequelize.define("LandObservation", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    land_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    agent_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},{
  tableName: "land_observation",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { unique: true, fields: ["land_id", "agent_id"] }
  ]
});

export default LandObservation;
