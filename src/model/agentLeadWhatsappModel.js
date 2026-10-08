import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

// A WhatsApp message sent to an agent lead from the desk. The message itself
// goes out through a wa.me link opened in the caller's browser, so the server
// never sees delivery — this is the desk's record that it was sent, by whom,
// and with what wording, shown as the lead's "WhatsApp trail".
const AgentLeadWhatsapp = sequelize.define(
  "AgentLeadWhatsapp",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    candidate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    template_name: { type: DataTypes.STRING },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Who sent it. Normally the logged-in employee; the recovery hub may credit
    // the support executive at a shared desk instead.
    sent_by: { type: DataTypes.INTEGER },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Only ever "Sent" today — kept as a column so a future WhatsApp API
    // integration can record Delivered / Read without a migration.
    delivery_status: {
      type: DataTypes.STRING,
      defaultValue: "Sent",
    },
  },
  {
    tableName: "agent_lead_whatsapp",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["candidate_id"] }],
  }
);

export default AgentLeadWhatsapp;
