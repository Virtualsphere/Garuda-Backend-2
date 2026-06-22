import {
  Land,
  FarmerDetails,
  LandDetails,
  LandGPS,
  LandMedia,
  LandDocuments,
  Employee,
  AssignedVillage,
  Path
} from "../model/associationModel.js";

import LandTree from "../model/landTreeModel.js";
import LandShedDimensions from "../model/landShedDimensionsModel.js";

import polyline from "@mapbox/polyline";
import sequelize from "../db/db.js";
import { Op } from "sequelize";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getLandWithFarmerDetails = async (landIds = []) => {
  if (!landIds || landIds.length === 0) return [];

  return await Land.findAll({
    where: { id: landIds },
    include: [{ model: FarmerDetails, as: "farmerDetails" }],
  });
};

const LAKH  = 100_000;
const CRORE = 10_000_000;

const toStoredPrice  = (raw) => (raw != null ? raw / LAKH  : null);
const toStoredValue  = (raw) => (raw != null ? raw / CRORE : null);

const DEFAULT_LAND_IMAGE =
  "https://images.pexels.com/photos/7752033/pexels-photo-7752033.jpeg?cs=srgb&dl=pexels-altaf-shah-3143825-7752033.jpg&fm=jpg&_gl=1*1rbwsk6*_ga*MTcwODY3MTM2Mi4xNzYzMTIzMzA3*_ga_8JE65Q40S6*czE3ODA0MTg1MDYkbzIkZzAkdDE3ODA0MTg1MDYkajYwJGwwJGgw";

// ---------------------------------------------------------------------------
// Standard includes
// ---------------------------------------------------------------------------

const FULL_LAND_INCLUDE = [
  { model: Employee,           as: "creator"      },
  { model: Employee,           as: "verifier"     },
  { model: FarmerDetails,      as: "farmerDetails"},
  { model: LandDetails,        as: "landDetails"  },
  { model: LandGPS,            as: "gps"          },
  { model: LandMedia,          as: "media"        },
  { model: LandDocuments,      as: "documents"    },
  { model: LandTree,           as: "tree"         },
  { model: LandShedDimensions, as: "shed"         },
];

const PUBLIC_LAND_INCLUDE = [
  { model: Employee,           as: "creator"      },
  { model: Employee,           as: "verifier"     },
  { model: LandDetails,        as: "landDetails"  },
  { model: LandGPS,            as: "gps"          },
  { model: LandMedia,          as: "media"        },
  { model: LandDocuments,      as: "documents"    },
  { model: LandTree,           as: "tree"         },
  { model: LandShedDimensions, as: "shed"         },
];

const VERIFICATION_INCLUDE = [
  { model: FarmerDetails,      as: "farmerDetails" },
  { model: LandDetails,        as: "landDetails"   },
  { model: LandGPS,            as: "gps"           },
  { model: LandMedia,          as: "media"         },
  { model: LandDocuments,      as: "documents"     },
  { model: LandTree,           as: "tree"          },
  { model: LandShedDimensions, as: "shed"          },
];

// ---------------------------------------------------------------------------
// Tree & Shed helpers — both use destroy + bulkCreate (replace-all pattern)
// ---------------------------------------------------------------------------

/**
 * Replace all trees for a land inside a transaction.
 * @param {number} landId
 * @param {Array}  trees — [{ type, count }]
 * @param {object} t     — Sequelize transaction
 */
const replaceTrees = async (landId, trees, t) => {
  await LandTree.destroy({ where: { land_id: landId }, transaction: t });

  if (trees && trees.length > 0) {
    const treeData = trees.map((tree) => ({
      land_id: landId,
      type:    tree.type,
      count:   tree.count,
    }));
    await LandTree.bulkCreate(treeData, { transaction: t });
  }
};

/**
 * Replace all shed dimension rows for a land inside a transaction.
 * Supports multiple sheds per land (e.g. 2 poultry sheds + 1 cow shed).
 *
 * @param {number} landId
 * @param {Array}  sheds — [{ poultry_shed_length, poultry_shed_width, cow_shed_length, cow_shed_width }]
 * @param {object} t     — Sequelize transaction
 */
const replaceSheds = async (landId, sheds, t) => {
  await LandShedDimensions.destroy({ where: { land_id: landId }, transaction: t });

  if (sheds && sheds.length > 0) {
    const shedData = sheds.map((shed) => ({
      land_id:             landId,
      poultry_shed_length: shed.poultry_shed_length ?? null,
      poultry_shed_width:  shed.poultry_shed_width  ?? null,
      cow_shed_length:     shed.cow_shed_length      ?? null,
      cow_shed_width:      shed.cow_shed_width       ?? null,
    }));
    await LandShedDimensions.bulkCreate(shedData, { transaction: t });
  }
};

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export const createLand = async (data, employeeId) => {
  // Guard: verify employee exists before inserting (avoids FK violation)
  const employee = await Employee.findByPk(employeeId);
  if (!employee) throw new Error("Employee not found — invalid token");

  const t = await sequelize.transaction();

  try {
    const {
      farmerDetails,
      landDetails: rawLandDetails,
      gps,
      media     = [],
      documents = [],
      trees     = [],
      shed      = [],   // Array of shed dimension objects
      ...landData
    } = data;

    // -- Land --
    const land = await Land.create(
      { ...landData, created_by: employeeId },
      { transaction: t }
    );

    // -- Farmer Details --
    if (farmerDetails) {
      await FarmerDetails.create(
        { ...farmerDetails, land_id: land.id },
        { transaction: t }
      );
    }

    // -- Land Details --
    if (landDetails) {
      await LandDetails.create(
        { ...landDetails, land_id: land.id },
        { transaction: t }
      );
    }

    // -- GPS --
    if (gps) {
      await LandGPS.create(
        { ...gps, land_id: land.id },
        { transaction: t }
      );
    }

    // -- Media (always add default card image) --
    const mediaData = media.map((m) => ({ ...m, land_id: land.id }));
    mediaData.push({
      land_id:  land.id,
      category: "card",
      type:     "image",
      url:      DEFAULT_LAND_IMAGE,
    });
    await LandMedia.bulkCreate(mediaData, { transaction: t });

    // -- Documents --
    if (documents.length) {
      const docData = documents.map((d) => ({ ...d, land_id: land.id }));
      await LandDocuments.bulkCreate(docData, { transaction: t });
    }

    // -- Trees --
    if (trees.length) {
      await replaceTrees(land.id, trees, t);
    }

    // -- Shed Dimensions (multiple rows allowed) --
    const shedArray = Array.isArray(shed) ? shed : [shed];
    if (shedArray.length) {
      await replaceSheds(land.id, shedArray, t);
    }

    await t.commit();
    return await getLandById(land.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

export const getAllLands = async () => {
  return await Land.findAll({
    include: FULL_LAND_INCLUDE,
    order: [["created_at", "DESC"]],
  });
};

export const getAllLandsForUser = async (filters = {}) => {
  const {
    state, district, mandal,
    min_price_per_acre, max_price_per_acre,
    min_total_budget,   max_total_budget,
    min_acres,          max_acres,
    soil_type, nearest_road_type, land_attached_to_road,
    water_source, farm_pond, residence, fencing_status,
    poultry_shed, cow_shed, electricity,
  } = filters;

  const landWhere = {};
  if (state)    landWhere.state    = state;
  if (district) landWhere.district = district;
  if (mandal)   landWhere.mandal   = mandal;

  const landDetailsWhere = {};

  if (min_price_per_acre || max_price_per_acre) {
    landDetailsWhere.price_per_acres = {
      ...(min_price_per_acre !== undefined && { [Op.gte]: min_price_per_acre }),
      ...(max_price_per_acre !== undefined && { [Op.lte]: max_price_per_acre }),
    };
  }
  if (min_total_budget || max_total_budget) {
    landDetailsWhere.total_value = {
      ...(min_total_budget !== undefined && { [Op.gte]: min_total_budget }),
      ...(max_total_budget !== undefined && { [Op.lte]: max_total_budget }),
    };
  }
  if (min_acres || max_acres) {
    landDetailsWhere.total_acres = {
      ...(min_acres !== undefined && { [Op.gte]: min_acres }),
      ...(max_acres !== undefined && { [Op.lte]: max_acres }),
    };
  }

  if (soil_type)             landDetailsWhere.soil_type             = soil_type;
  if (nearest_road_type)     landDetailsWhere.nearest_road_type     = nearest_road_type;
  if (land_attached_to_road) landDetailsWhere.land_attached_to_road = land_attached_to_road;
  if (fencing_status)        landDetailsWhere.fencing_status        = fencing_status;

  if (water_source && Array.isArray(water_source) && water_source.length > 0)
    landDetailsWhere.water_source = { [Op.contains]: water_source };
  if (residence && Array.isArray(residence) && residence.length > 0)
    landDetailsWhere.residence = { [Op.contains]: residence };
  if (electricity && Array.isArray(electricity) && electricity.length > 0)
    landDetailsWhere.electricity = { [Op.contains]: electricity };

  if (farm_pond !== undefined) landDetailsWhere.farm_pond           = farm_pond;
  if (poultry_shed === true)   landDetailsWhere.poultry_shed_number = { [Op.gt]: 0 };
  if (cow_shed     === true)   landDetailsWhere.cow_shed_number     = { [Op.gt]: 0 };

  const landDetailsInclude = {
    model:    LandDetails,
    as:       "landDetails",
    required: false,
  };
  if (Object.keys(landDetailsWhere).length > 0) {
    landDetailsInclude.where    = landDetailsWhere;
    landDetailsInclude.required = true;
  }

  return await Land.findAll({
    where: landWhere,
    include: [
      landDetailsInclude,
      { model: LandGPS,            as: "gps",       required: false },
      { model: LandMedia,          as: "media",     required: false },
      { model: LandDocuments,      as: "documents", required: false },
      { model: LandTree,           as: "tree",      required: false },
      { model: LandShedDimensions, as: "shed",      required: false },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getLandById = async (id) => {
  const land = await Land.findByPk(id, { include: FULL_LAND_INCLUDE });
  if (!land) throw new Error("Land not found");
  return land;
};

export const getLandByIdForUser = async (id) => {
  const land = await Land.findByPk(id, { include: PUBLIC_LAND_INCLUDE });
  if (!land) throw new Error("Land not found");
  return land.toJSON();
};

export const getLandByStatus = async (userId, status) => {
  const lands = await Land.findAll({
    where:   { created_by: userId, form_status: status },
    include: FULL_LAND_INCLUDE,
    order:   [["created_at", "DESC"]],
  });

  if (!lands || lands.length === 0) {
    throw new Error(`No lands found with status: ${status}`);
  }

  return lands;
};

export const filterLands = async (filters) => {
  const where = {};
  if (filters.state)    where.state    = filters.state;
  if (filters.district) where.district = filters.district;
  if (filters.mandal)   where.mandal   = filters.mandal;
  if (filters.village)  where.village  = filters.village;

  return await Land.findAll({
    where,
    include: [
      { model: LandDetails,        as: "landDetails" },
      { model: LandMedia,          as: "media"       },
      { model: LandTree,           as: "tree"        },
      { model: LandShedDimensions, as: "shed"        },
    ],
  });
};

// ---------------------------------------------------------------------------
// UPDATE — shared inner logic
// ---------------------------------------------------------------------------

const _updateLandCore = async (id, data, extraLandFields = {}, t) => {
  const land = await Land.findByPk(id, { transaction: t });
  if (!land) throw new Error("Land not found");

  const {
    farmerDetails,
    landDetails: rawLandDetails,
    gps,
    media,
    documents,
    trees,
    shed,
    ...landData
  } = data;

  await land.update({ ...landData, ...extraLandFields }, { transaction: t });

  // -- Farmer Details --
  if (farmerDetails) {
    const existing = await FarmerDetails.findOne({ where: { land_id: id }, transaction: t });
    existing
      ? await existing.update(farmerDetails, { transaction: t })
      : await FarmerDetails.create({ ...farmerDetails, land_id: id }, { transaction: t });
  }

  // -- Land Details --
  if (landDetails) {
    const existing = await LandDetails.findOne({ where: { land_id: id }, transaction: t });
    existing
      ? await existing.update(landDetails, { transaction: t })
      : await LandDetails.create({ ...landDetails, land_id: id }, { transaction: t });
  }

  // -- GPS --
  if (gps) {
    const existing = await LandGPS.findOne({ where: { land_id: id }, transaction: t });
    existing
      ? await existing.update(gps, { transaction: t })
      : await LandGPS.create({ ...gps, land_id: id }, { transaction: t });
  }

  // -- Media --
  if (media) {
    await LandMedia.destroy({ where: { land_id: id }, transaction: t });
    const mediaData = media.map((m) => ({ ...m, land_id: id }));
    await LandMedia.bulkCreate(mediaData, { transaction: t });
  }

  // -- Documents --
  if (documents) {
    await LandDocuments.destroy({ where: { land_id: id }, transaction: t });
    const docData = documents.map((d) => ({ ...d, land_id: id }));
    await LandDocuments.bulkCreate(docData, { transaction: t });
  }

  // -- Trees — replace all if provided, omit field to leave unchanged --
  if (trees !== undefined) {
    await replaceTrees(id, trees, t);
  }

  // -- Shed Dimensions — replace all rows if provided, omit field to leave unchanged --
  if (shed !== undefined) {
    const shedArray = Array.isArray(shed) ? shed : [shed];
    await replaceSheds(id, shedArray, t);
  }
};

export const updateLand = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    await _updateLandCore(id, data, {}, t);
    await t.commit();
    return await getLandById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateLandForVerify = async (id, data, employeeId) => {
  const t = await sequelize.transaction();
  try {
    await _updateLandCore(id, data, { verified_by: employeeId }, t);
    await t.commit();
    return await getLandById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateLandForCallVerify = async (id, data, employeeId) => {
  const t = await sequelize.transaction();
  try {
    await _updateLandCore(id, data, { call_verification_by: employeeId }, t);
    await t.commit();
    return await getLandById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export const deleteLand = async (id) => {
  const land = await Land.findByPk(id);
  if (!land) throw new Error("Land not found");
  await land.destroy();
  return true;
};

// ---------------------------------------------------------------------------
// Verification queues
// ---------------------------------------------------------------------------

export const getPendingCallVerificationLands = async (status) => {
  return await Land.findAll({
    where:   { call_verification_status: status, form_status: "complete" },
    include: VERIFICATION_INCLUDE,
    order:   [["created_at", "DESC"]],
  });
};

export const getPendingPhysicalVerificationLands = async (status) => {
  return await Land.findAll({
    where:   { call_verification_status: "complete", physcial_verification_status: status },
    include: VERIFICATION_INCLUDE,
    order:   [["created_at", "DESC"]],
  });
};

export const getPendingFinalVerificationLands = async (status) => {
  return await Land.findAll({
    where:   { physcial_verification_status: "complete", verification_status: status },
    include: VERIFICATION_INCLUDE,
    order:   [["created_at", "DESC"]],
  });
};

// ---------------------------------------------------------------------------
// Assigned Villages
// ---------------------------------------------------------------------------

export const createAssignedVillage = async (
  target, assignedStatus, assignedEmployeeId, village, mandal,
  physicalVerified = [], landCreated = [], verifiedLand = [], completeLand = []
) => {
  return await AssignedVillage.create({
    target,
    assigned_status:      assignedStatus,
    village,
    mandal,
    assigned_employee_id: assignedEmployeeId,
    physical_verified:    physicalVerified,
    listed:               0,
    land_created:         landCreated,
    verified:             verifiedLand,
    complete_details:     completeLand,
  });
};

export const getAllAssignedVillages = async () => {
  const villages = await AssignedVillage.findAll({
    include: [{ model: Employee, as: "assigned" }],
    order:   [["created_at", "DESC"]],
  });

  const result = [];
  for (const village of villages) {
    const data             = village.toJSON();
    data.land_created      = await getLandWithFarmerDetails(data.land_created);
    data.verified          = await getLandWithFarmerDetails(data.verified);
    data.complete_details  = await getLandWithFarmerDetails(data.complete_details);
    data.physical_verified = await getLandWithFarmerDetails(data.physical_verified);
    result.push(data);
  }
  return result;
};

export const getAssignedVillageById = async (id) => {
  const assignedVillage = await AssignedVillage.findByPk(id, {
    include: [{ model: Employee, as: "assigned" }],
  });
  if (!assignedVillage) throw new Error("AssignedVillage not found");

  const data             = assignedVillage.toJSON();
  data.land_created      = await getLandWithFarmerDetails(data.land_created);
  data.verified          = await getLandWithFarmerDetails(data.verified);
  data.complete_details  = await getLandWithFarmerDetails(data.complete_details);
  data.physical_verified = await getLandWithFarmerDetails(data.physical_verified);
  return data;
};

export const updateAssignedVillage = async (data) => {
  const t = await sequelize.transaction();
  try {
    const assignedVillage = await AssignedVillage.findByPk(data.id);
    if (!assignedVillage) throw new Error("AssignedVillage not found");

    await assignedVillage.update(
      {
        listed:            data.listed,
        land_created:      data.land_created,
        verified:          data.verified,
        complete_details:  data.complete_details,
        physical_verified: data.physical_verified,
        assigned_status:   data.assigned_status,
      },
      { transaction: t }
    );
    await t.commit();
    return await getAssignedVillageById(data.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteAssignedVillage = async (id) => {
  const assignedVillage = await AssignedVillage.findByPk(id);
  if (!assignedVillage) throw new Error("AssignedVillage not found");
  await assignedVillage.destroy();
  return true;
};

export const getAssignedVillagesByEmployee = async (employeeId) => {
  const assignedVillages = await AssignedVillage.findAll({
    where:   { assigned_employee_id: employeeId, assigned_status: "ongoing" },
    include: [{ model: Employee, as: "assigned" }],
    order:   [["created_at", "DESC"]],
  });

  if (!assignedVillages || assignedVillages.length === 0) {
    throw new Error("No ongoing AssignedVillages found");
  }

  const getCount = (field) => {
    if (!field)                    return 0;
    if (Array.isArray(field))      return field.length;
    if (typeof field === "object") return Object.keys(field).length;
    return 0;
  };

  const result = [];
  for (const village of assignedVillages) {
    const data                 = village.toJSON();
    const landCreatedData      = await getLandWithFarmerDetails(data.land_created);
    const verifiedData         = await getLandWithFarmerDetails(data.verified);
    const completeDetailsData  = await getLandWithFarmerDetails(data.complete_details);
    const physicalVerifiedData = await getLandWithFarmerDetails(data.physical_verified);

    result.push({
      ...data,
      land_created:            landCreatedData,
      verified:                verifiedData,
      complete_details:        completeDetailsData,
      physical_verified:       physicalVerifiedData,
      land_created_ids:        data.land_created      || [],
      verified_ids:            data.verified          || [],
      complete_details_ids:    data.complete_details  || [],
      physical_verified_ids:   data.physical_verified || [],
      land_created_count:      getCount(data.land_created),
      verified_count:          getCount(data.verified),
      complete_details_count:  getCount(data.complete_details),
      physical_verified_count: getCount(data.physical_verified),
    });
  }
  return result;
};

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const createPath = async (employeeId, data) => {
  const { path_type, path, photo } = data;
  if (!path || !Array.isArray(path) || path.length === 0) {
    throw new Error("Path coordinates are required");
  }

  const points      = path.map((p) => [p.latitude, p.longitude]);
  const encodedPath = polyline.encode(points);
  return await Path.create({ employee_id: employeeId, path_type, path: encodedPath, photo });
};

export const getPathsByEmployee = async (employeeId) => {
  return await Path.findAll({
    where: { employee_id: employeeId },
    order: [["created_at", "DESC"]],
    raw:   true,
  });
};

export const getPathsByEmployeeWithLatAndLong = async (employeeId) => {
  const paths = await Path.findAll({
    where: { employee_id: employeeId },
    order: [["created_at", "DESC"]],
  });

  return paths.map((item) => {
    let decodedPath = [];
    if (item.path) {
      const decoded = polyline.decode(item.path);
      decodedPath   = decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
    }
    return { ...item.toJSON(), path: decodedPath };
  });
};