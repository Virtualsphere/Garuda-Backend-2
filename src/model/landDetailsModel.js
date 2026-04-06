import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

const LandDetails = sequelize.define("LandDetails", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  land_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_acres: {
    type: DataTypes.FLOAT
  },
  guntas: {
    type: DataTypes.FLOAT
  },
  price_per_acres: {
    type: DataTypes.FLOAT
  },
  total_value: {
    type: DataTypes.DOUBLE
  },
  nearest_road_type: {
    type: DataTypes.ENUM('Highway', 'Double Road', 'Single Road', 'Gravel Road')
  },
  land_attached_to_road: {
    type: DataTypes.ENUM('yes', 'no')
  },
  path_ownership: {
    type: DataTypes.ENUM('Naksha path', 'No Naksha', 'Purchased')
  },
  land_entry_latitude: {
    type: DataTypes.STRING
  },
  land_entry_longitude: {
    type: DataTypes.STRING
  },
  land_boundary_latitude: {
    type: DataTypes.STRING
  },
  land_boundary_longitude: {
    type: DataTypes.STRING
  },
  soil_type: {
    type: DataTypes.ENUM('red', 'black', 'sandy', 'aluvial'),
    defaultValue: 'red'
  },
  fencing_status: {
    type: DataTypes.ENUM('all sides with gate', 'all sides', 'partially', 'no'),
    defaultValue: 'all sides with gate'
  },
  electricity: {
    type: DataTypes.ARRAY(
      DataTypes.ENUM(
        "single phase",
        "three phase"
      )
    ),
    allowNull: false,
  },
  residence: {
    type: DataTypes.ARRAY(
      DataTypes.ENUM(
        "developed farm",
        "rcc house",
        "asbestos shelter",
        "hut"
      )
    ),
    allowNull: false,
  },
  poultry_shed_number: {
    type: DataTypes.INTEGER
  },
  cow_shed_number: {
    type: DataTypes.INTEGER
  },
  water_source: {
    type: DataTypes.ARRAY(
      DataTypes.ENUM(
        "borewell",
        "cheruvu",
        "canal",
        "not available"
      )
    ),
    allowNull: false,
  },
  number_of_bores: {
    type: DataTypes.INTEGER
  },
  farm_pond: {
    type: DataTypes.BOOLEAN
  },
  mango_trees_number: {
    type: DataTypes.STRING
  },
  coconut_trees_number: {
    type: DataTypes.STRING
  },
  neem_trees_number: {
    type: DataTypes.STRING
  },
  baniyan_trees_number: {
    type: DataTypes.STRING
  },
  tamarind_trees_number: {
    type: DataTypes.STRING
  },
  sapoto_trees_number: {
    type: DataTypes.STRING
  },
  guava_trees_number: {
    type: DataTypes.STRING
  },
  teak_trees_number: {
    type: DataTypes.STRING
  },
  other_trees_number: {
    type: DataTypes.STRING
  },
  complaints: {
    type: DataTypes.JSONB
  }
}, {
  tableName: "land_details",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default LandDetails;