import Employee from "./employeeModel.js";
import Land from "./landModel.js";
import FarmerDetails from "./farmerDetailsModel.js";
import LandDetails from "./landDetailsModel.js";
import LandGPS from "./landGpsModel.js";
import LandMedia from "./landMediaModel.js";
import LandDocuments from "./landDocumentsModel.js";
import Buyer from "./buyerModel.js";
import RefreshToken from "./refreshTokenModel.js";
import State from "./stateModel.js";
import Village from "./villageModel.js";
import District from "./districtModel.js";
import Mandal from "./mandalModel.js";
import Role from "./roleModel.js";

Employee.hasMany(Land, {
  foreignKey: "created_by",
  as: "createdLands",
});

State.hasMany(District, {
  foreignKey: "state_id",
  as: "districts",
});

District.belongsTo(State, {
  foreignKey: "state_id",
  as: "state",
});

District.hasMany(Mandal, {
  foreignKey: "district_id",
  as: "mandals",
});

Mandal.belongsTo(District, {
  foreignKey: "district_id",
  as: "district",
});

Mandal.hasMany(Village, {
  foreignKey: "mandal_id",
  as: "villages",
});

Village.belongsTo(Mandal, {
  foreignKey: "mandal_id",
  as: "mandal",
});

Land.belongsTo(Employee, {
  foreignKey: "created_by",
  as: "creator",
});

Employee.hasMany(Land, {
  foreignKey: "verified_by",
  as: "verifiedLands",
});

Land.belongsTo(Employee, {
  foreignKey: "verified_by",
  as: "verifier",
});

Land.hasOne(FarmerDetails, {
  foreignKey: "land_id",
  as: "farmerDetails",
  onDelete: "CASCADE",
});

FarmerDetails.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasOne(LandDetails, {
  foreignKey: "land_id",
  as: "landDetails",
  onDelete: "CASCADE",
});

LandDetails.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasOne(LandGPS, {
  foreignKey: "land_id",
  as: "gps",
  onDelete: "CASCADE",
});

LandGPS.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasMany(LandMedia, {
  foreignKey: "land_id",
  as: "media",
  onDelete: "CASCADE",
});

LandMedia.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasMany(LandDocuments, {
  foreignKey: "land_id",
  as: "documents",
  onDelete: "CASCADE",
});

LandDocuments.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

export {
  Land,
  FarmerDetails,
  LandDetails,
  LandGPS,
  LandMedia,
  LandDocuments,
  Employee,
  RefreshToken,
  Buyer,
  State,
  District,
  Village,
  Mandal
};