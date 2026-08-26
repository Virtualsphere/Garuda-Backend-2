import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// Territory deployment: an agent can be posted to several village nodes.
// agent.village stays the agent's home/primary village; these rows are the
// full assigned territory the tactical map clusters their avatar onto.
const AgentVillage = sequelize.define("AgentVillage", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    agent_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING
    },
    district: {
        type: DataTypes.STRING
    },
    mandal: {
        type: DataTypes.STRING
    },
    village: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
  tableName: "agent_village",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default AgentVillage;
