import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

/**
 * One row per Home / Plot / Venture / Villa listing (the four Garuda listing
 * forms). Fields common to every form — location, GPS, media and the contact
 * block (16-20) — are real columns; the type-specific property fields (02-13)
 * live in `details` (JSONB) and are validated per type by
 * service/propertyListingService.js.
 */
const PropertyListing = sequelize.define("PropertyListing", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  listing_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [["home", "plot", "venture", "villa"]] },
  },

  // 01. Location
  state_id: { type: DataTypes.INTEGER, allowNull: true },
  district_id: { type: DataTypes.INTEGER, allowNull: true },
  town_id: { type: DataTypes.INTEGER, allowNull: true },
  state_name: { type: DataTypes.STRING, allowNull: true },
  district_name: { type: DataTypes.STRING, allowNull: true },
  town_name: { type: DataTypes.STRING, allowNull: true },
  // Free-text locality within the town ("Town / Area" on the form)
  town_area: { type: DataTypes.STRING, allowNull: true },

  // 02-13. Type-specific property fields
  details: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },

  // 14. GPS (private)
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  maps_link: { type: DataTypes.TEXT, allowNull: true },

  // 15. Media — [{ kind: 'photo'|'video'|'floor_plan'|'layout_map', url }]
  media: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },

  // 16-20. Contact / listing details (private)
  contact_name: { type: DataTypes.STRING, allowNull: false },
  mobile: { type: DataTypes.STRING(15), allowNull: false },
  whatsapp_same_as_mobile: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  whatsapp_number: { type: DataTypes.STRING(15), allowNull: true },
  contact_type: { type: DataTypes.STRING(40), allowNull: false },
  is_direct_listing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  agent_code: { type: DataTypes.STRING, allowNull: true },

  // Approval workflow — "Approval and property claims require verification."
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "pending",
    validate: { isIn: [["pending", "approved", "rejected"]] },
  },
  remarks: { type: DataTypes.TEXT, allowNull: true },

  created_by: { type: DataTypes.INTEGER, allowNull: true },
  updated_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "property_listings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["listing_type"] },
    { fields: ["status"] },
  ],
});

export default PropertyListing;
