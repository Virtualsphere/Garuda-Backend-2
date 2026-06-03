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

import polyline from "@mapbox/polyline";

import sequelize from "../db/db.js";

import { Op } from "sequelize";

const getLandWithFarmerDetails = async (landIds = []) => {
  if (!landIds || landIds.length === 0) return [];

  const lands = await Land.findAll({
    where: {
      id: landIds,
    },
    include: [
      {
        model: FarmerDetails,
        as: "farmerDetails",
      },
    ],
  });

  return lands;
};

const TREE_FIELD_MAP = [
  { field: "mango_trees_number",    type: "Mango"    },
  { field: "coconut_trees_number",  type: "Coconut"  },
  { field: "neem_trees_number",     type: "Neem"     },
  { field: "baniyan_trees_number",  type: "Baniyan"  },
  { field: "tamarind_trees_number", type: "Tamarind" },
  { field: "sapoto_trees_number",   type: "Sapoto"   },
  { field: "guava_trees_number",    type: "Guava"    },
  { field: "teak_trees_number",     type: "Teak"     },
  { field: "other_trees_number",    type: null       }, // null = dynamic
];

const parseTrees = (landDetails) => {
  if (!landDetails) return [];

  return TREE_FIELD_MAP
    .map(({ field, type }) => {
      const raw = landDetails[field]; // e.g. "mango-10" or "apple-10"
      if (!raw) return null;

      const lastDash = raw.lastIndexOf("-");
      if (lastDash === -1) return null;

      const name  = raw.slice(0, lastDash);   // "apple"
      const count = parseInt(raw.slice(lastDash + 1), 10); // 10

      if (!count || count <= 0) return null;

      return {
        type:  type ?? name.charAt(0).toUpperCase() + name.slice(1), // use dynamic name if type is null
        count,
      };
    })
    .filter(Boolean);
};

const DEFAULT_LAND_IMAGE = "https://images.pexels.com/photos/7752033/pexels-photo-7752033.jpeg?cs=srgb&amp;dl=pexels-altaf-shah-3143825-7752033.jpg&amp;fm=jpg&amp;_gl=1*1rbwsk6*_ga*MTcwODY3MTM2Mi4xNzYzMTIzMzA3*_ga_8JE65Q40S6*czE3ODA0MTg1MDYkbzIkZzAkdDE3ODA0MTg1MDYkajYwJGwwJGgw";

export const createLand = async (data, employeeId) => {
  const t = await sequelize.transaction();

  try {
    const {
      farmerDetails,
      landDetails,
      gps,
      media = [],
      documents = [],
      ...landData
    } = data;

    // Create Land
    const land = await Land.create(
      {
        ...landData,
        created_by: employeeId,
      },
      { transaction: t }
    );

    // Farmer Details
    if (farmerDetails) {
      await FarmerDetails.create(
        { ...farmerDetails, land_id: land.id },
        { transaction: t }
      );
    }

    // Land Details
    if (landDetails) {
      await LandDetails.create(
        { ...landDetails, land_id: land.id },
        { transaction: t }
      );
    }

    // GPS
    if (gps) {
      await LandGPS.create(
        { ...gps, land_id: land.id },
        { transaction: t }
      );
    }

    // Media
    // Media (with default fallback)
    let mediaData = [];

    if (media && media.length > 0) {
      mediaData = media.map((m) => ({
        ...m,
        land_id: land.id,
      }));
    } 
    mediaData.push({
      land_id: land.id,
      category: "card",
      type: "image",
      url: DEFAULT_LAND_IMAGE,
    });

    await LandMedia.bulkCreate(mediaData, { transaction: t });

    // Documents
    if (documents.length) {
      const docData = documents.map((d) => ({
        ...d,
        land_id: land.id,
      }));

      await LandDocuments.bulkCreate(docData, { transaction: t });
    }

    await t.commit();

    return await getLandById(land.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getAllLands = async () => {
  return await Land.findAll({
    include: [
      { model: Employee, as: "creator" },
      { model: Employee, as: "verifier" },
      { model: FarmerDetails, as: "farmerDetails" },
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getAllLandsForUser = async (filters = {}) => {
  const {
    state,
    district,
    mandal,
    // town — not destructured, intentionally ignored
    min_price_per_acre,
    max_price_per_acre,
    min_total_budget,
    max_total_budget,
    min_acres,
    max_acres,
    soil_type,
    nearest_road_type,
    land_attached_to_road,
    water_source,
    farm_pond,
    residence,
    fencing_status,
    poultry_shed,
    cow_shed,
    electricity,
  } = filters;

  // -------------------------
  // Land (top-level) filters
  // -------------------------
  const landWhere = {};

  if (state)    landWhere.state    = state;
  if (district) landWhere.district = district;
  if (mandal)   landWhere.mandal   = mandal;

  // -------------------------
  // LandDetails filters
  // -------------------------
  const landDetailsWhere = {};

  // Price per acre range
  if (min_price_per_acre || max_price_per_acre) {
    landDetailsWhere.price_per_acres = {
      ...(min_price_per_acre !== undefined && { [Op.gte]: min_price_per_acre }),
      ...(max_price_per_acre !== undefined && { [Op.lte]: max_price_per_acre }),
    };
  }

  // Total budget range
  if (min_total_budget || max_total_budget) {
    landDetailsWhere.total_value = {
      ...(min_total_budget !== undefined && { [Op.gte]: min_total_budget }),
      ...(max_total_budget !== undefined && { [Op.lte]: max_total_budget }),
    };
  }

  // Area range (acres)
  if (min_acres || max_acres) {
    landDetailsWhere.total_acres = {
      ...(min_acres !== undefined && { [Op.gte]: min_acres }),
      ...(max_acres !== undefined && { [Op.lte]: max_acres }),
    };
  }

  // Soil type — single string value from DB
  if (soil_type) {
    landDetailsWhere.soil_type = soil_type;
  }

  // Nearest road type — single string value from DB
  if (nearest_road_type) {
    landDetailsWhere.nearest_road_type = nearest_road_type;
  }

  // Attached to road — ENUM 'yes' | 'no'
  if (land_attached_to_road) {
    landDetailsWhere.land_attached_to_road = land_attached_to_road; // expect "yes" or "no"
  }

  // Fencing status — single string value from DB
  if (fencing_status) {
    landDetailsWhere.fencing_status = fencing_status;
  }

  // Water source — JSONB array, use Op.contains
  if (water_source && Array.isArray(water_source) && water_source.length > 0) {
    landDetailsWhere.water_source = { [Op.contains]: water_source };
  }

  // Residence — JSONB array, use Op.contains
  if (residence && Array.isArray(residence) && residence.length > 0) {
    landDetailsWhere.residence = { [Op.contains]: residence };
  }

  // Electricity — JSONB array, use Op.contains
  if (electricity && Array.isArray(electricity) && electricity.length > 0) {
    landDetailsWhere.electricity = { [Op.contains]: electricity };
  }

  // Farm pond — boolean, only filter when explicitly provided
  if (farm_pond !== undefined) {
    landDetailsWhere.farm_pond = farm_pond;
  }

  // Poultry shed — filter lands that have at least 1
  if (poultry_shed === true) {
    landDetailsWhere.poultry_shed_number = { [Op.gt]: 0 };
  }

  // Cow shed — filter lands that have at least 1
  if (cow_shed === true) {
    landDetailsWhere.cow_shed_number = { [Op.gt]: 0 };
  }

  // -------------------------
  // LandDetails include setup
  // -------------------------
  const landDetailsInclude = {
    model: LandDetails,
    as: "landDetails",
    required: false, // LEFT JOIN by default — returns all lands
  };

  // Switch to INNER JOIN only when at least one detail-level filter is active
  if (Object.keys(landDetailsWhere).length > 0) {
    landDetailsInclude.where = landDetailsWhere;
    landDetailsInclude.required = true;
  }

  // -------------------------
  // Final query
  // -------------------------
  return await Land.findAll({
    where: landWhere,
    include: [
      landDetailsInclude,
      { model: LandGPS,       as: "gps",       required: false },
      { model: LandMedia,     as: "media",      required: false },
      { model: LandDocuments, as: "documents",  required: false },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getLandById = async (id) => {
  const land = await Land.findByPk(id, {
    include: [
      { model: Employee, as: "creator" },
      { model: Employee, as: "verifier" },
      { model: FarmerDetails, as: "farmerDetails" },
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
  });

  if (!land) throw new Error("Land not found");

  return land;
};

export const getLandByIdForUser = async (id) => {
  const land = await Land.findByPk(id, {
    include: [
      { model: Employee,     as: "creator"     },
      { model: Employee,     as: "verifier"    },
      { model: LandDetails,  as: "landDetails" },
      { model: LandGPS,      as: "gps"         },
      { model: LandMedia,    as: "media"        },
      { model: LandDocuments, as: "documents"  },
    ],
  });

  if (!land) throw new Error("Land not found");

  const result = land.toJSON();

  if (result.landDetails) {
    result.landDetails.trees = parseTrees(result.landDetails);
    TREE_FIELD_MAP.forEach(({ field }) => delete result.landDetails[field]);
  }

  return result;
};

export const getLandByStatus = async (userId, status) => {
  const lands = await Land.findAll({
    where: { 
      created_by: userId, 
      form_status: status 
    },
    include: [
      { model: Employee, as: "creator" },
      { model: Employee, as: "verifier" },
      { model: FarmerDetails, as: "farmerDetails" },
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
    order: [["created_at", "DESC"]],
  });

  if (!lands || lands.length === 0) {
    throw new Error(`No lands found with status: ${status}`);
  }

  return lands;
};

export const updateLandForVerify = async (id, data, employeeId) => {
  const t = await sequelize.transaction();

  try {
    const land = await Land.findByPk(id);
    if (!land) throw new Error("Land not found");

    const {
      farmerDetails,
      landDetails,
      gps,
      media,
      documents,
      ...landData
    } = data;

    await land.update(
      {
        ...landData,
        verified_by: employeeId,
      },
      { transaction: t }
    );

    if (farmerDetails) {
      const existing = await FarmerDetails.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(farmerDetails, { transaction: t });
      } else {
        await FarmerDetails.create(
          { ...farmerDetails, land_id: id },
          { transaction: t }
        );
      }
    }

    if (landDetails) {
      const existing = await LandDetails.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(landDetails, { transaction: t });
      } else {
        await LandDetails.create(
          { ...landDetails, land_id: id },
          { transaction: t }
        );
      }
    }

    if (gps) {
      const existing = await LandGPS.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(gps, { transaction: t });
      } else {
        await LandGPS.create(
          { ...gps, land_id: id },
          { transaction: t }
        );
      }
    }

    if (media) {
      await LandMedia.destroy({ where: { land_id: id }, transaction: t });

      const mediaData = media.map((m) => ({
        ...m,
        land_id: id,
      }));

      await LandMedia.bulkCreate(mediaData, { transaction: t });
    }

    if (documents) {
      await LandDocuments.destroy({ where: { land_id: id }, transaction: t });

      const docData = documents.map((d) => ({
        ...d,
        land_id: id,
      }));

      await LandDocuments.bulkCreate(docData, { transaction: t });
    }

    await t.commit();

    return await getLandById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateLand = async (id, data) => {
  const t = await sequelize.transaction();

  try {
    const land = await Land.findByPk(id);
    if (!land) throw new Error("Land not found");

    const {
      farmerDetails,
      landDetails,
      gps,
      media,
      documents,
      ...landData
    } = data;

    await land.update(
      {
        ...landData,
      },
      { transaction: t }
    );

    if (farmerDetails) {
      const existing = await FarmerDetails.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(farmerDetails, { transaction: t });
      } else {
        await FarmerDetails.create(
          { ...farmerDetails, land_id: id },
          { transaction: t }
        );
      }
    }

    if (landDetails) {
      const existing = await LandDetails.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(landDetails, { transaction: t });
      } else {
        await LandDetails.create(
          { ...landDetails, land_id: id },
          { transaction: t }
        );
      }
    }

    if (gps) {
      const existing = await LandGPS.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(gps, { transaction: t });
      } else {
        await LandGPS.create(
          { ...gps, land_id: id },
          { transaction: t }
        );
      }
    }

    if (media) {
      await LandMedia.destroy({ where: { land_id: id }, transaction: t });

      const mediaData = media.map((m) => ({
        ...m,
        land_id: id,
      }));

      await LandMedia.bulkCreate(mediaData, { transaction: t });
    }

    if (documents) {
      await LandDocuments.destroy({ where: { land_id: id }, transaction: t });

      const docData = documents.map((d) => ({
        ...d,
        land_id: id,
      }));

      await LandDocuments.bulkCreate(docData, { transaction: t });
    }

    await t.commit();

    return await getLandById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteLand = async (id) => {
  const land = await Land.findByPk(id);
  if (!land) throw new Error("Land not found");

  await land.destroy(); // CASCADE will handle children

  return true;
};

export const filterLands = async (filters) => {
  const where = {};

  if (filters.state) where.state = filters.state;
  if (filters.district) where.district = filters.district;
  if (filters.mandal) where.mandal = filters.mandal;
  if (filters.village) where.village = filters.village;

  return await Land.findAll({
    where,
    include: [
      { model: LandDetails, as: "landDetails" },
      { model: LandMedia, as: "media" },
    ],
  });
};

export const createAssignedVillage = async (
  target,
  assignedStatus,
  assignedEmployeeId,
  village,
  mandal,
  physicalVerified = [],
  landCreated= [],
  verifiedLand= [],
  completeLand= []
) => {
  try {
    const assignedVillage = await AssignedVillage.create({
      target,
      assigned_status: assignedStatus,
      village,
      mandal,
      assigned_employee_id: assignedEmployeeId,
      physical_verified: physicalVerified,
      listed: 0,
      land_created: landCreated,
      verified: verifiedLand,
      complete_details: completeLand,
    });

    return assignedVillage;
  } catch (error) {
    throw error;
  }
};

export const getAllAssignedVillages = async () => {
  const villages = await AssignedVillage.findAll({
    include: [
      {
        model: Employee,
        as: "assigned",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const result = [];

  for (const village of villages) {
    const data = village.toJSON();

    data.land_created = await getLandWithFarmerDetails(data.land_created);
    data.verified = await getLandWithFarmerDetails(data.verified);
    data.complete_details = await getLandWithFarmerDetails(data.complete_details);
    data.physical_verified = await getLandWithFarmerDetails(data.physical_verified);

    result.push(data);
  }

  return result;
};

export const getAssignedVillageById = async (id) => {
  const assignedVillage = await AssignedVillage.findByPk(id, {
    include: [
      {
        model: Employee,
        as: "assigned",
      },
    ],
  });

  if (!assignedVillage) {
    throw new Error("AssignedVillage not found");
  }

  const data = assignedVillage.toJSON();

  data.land_created = await getLandWithFarmerDetails(data.land_created);
  data.verified = await getLandWithFarmerDetails(data.verified);
  data.complete_details = await getLandWithFarmerDetails(data.complete_details);
  data.physical_verified = await getLandWithFarmerDetails(data.physical_verified);

  return data;
};

export const updateAssignedVillage = async (data) => {
  const t = await sequelize.transaction();

  try {
    const assignedVillage = await AssignedVillage.findByPk(data.id);

    if (!assignedVillage) {
      throw new Error("AssignedVillage not found");
    }

    await assignedVillage.update(
      {
        listed: data.listed,
        land_created: data.land_created,
        verified: data.verified,
        complete_details: data.complete_details,
        physical_verified: data.physical_verified,
        assigned_status: data.assigned_status,
      },
      { transaction: t }
    );

    await t.commit();

    return await getAssignedVillageById(data.id); // ✅ fixed
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteAssignedVillage = async (id) => {
  const assignedVillage = await AssignedVillage.findByPk(id);

  if (!assignedVillage) {
    throw new Error("AssignedVillage not found");
  }

  await assignedVillage.destroy();

  return true;
};

export const getAssignedVillagesByEmployee = async (employeeId) => {
  const assignedVillages = await AssignedVillage.findAll({
    where: {
      assigned_employee_id: employeeId,
      assigned_status: "ongoing",
    },
    include: [
      {
        model: Employee,
        as: "assigned",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  if (!assignedVillages || assignedVillages.length === 0) {
    throw new Error("No ongoing AssignedVillages found");
  }

  const getCount = (field) => {
    if (!field) return 0;
    if (Array.isArray(field)) return field.length;
    if (typeof field === "object") return Object.keys(field).length;
    return 0;
  };

  const result = [];

  for (const village of assignedVillages) {
    const data = village.toJSON();

    const landCreatedData = await getLandWithFarmerDetails(data.land_created);
    const verifiedData = await getLandWithFarmerDetails(data.verified);
    const completeDetailsData = await getLandWithFarmerDetails(data.complete_details);
    const physicalVerifiedData = await getLandWithFarmerDetails(data.physical_verified);

    result.push({
      ...data,

      land_created: landCreatedData,
      verified: verifiedData,
      complete_details: completeDetailsData,
      physical_verified: physicalVerifiedData,

      land_created_ids: data.land_created || [],
      verified_ids: data.verified || [],
      complete_details_ids: data.complete_details || [],
      physical_verified_ids: data.physical_verified || [],

      land_created_count: getCount(data.land_created),
      verified_count: getCount(data.verified),
      complete_details_count: getCount(data.complete_details),
      physical_verified_count: getCount(data.physical_verified),
    });
  }

  return result;
};

export const createPath = async (employeeId, data) => {
  const { path_type, path, photo } = data;

  if (!path || !Array.isArray(path) || path.length === 0) {
    throw new Error("Path coordinates are required");
  }

  const points = path.map((p) => [p.latitude, p.longitude]);

  const encodedPath = polyline.encode(points);

  const result = await Path.create({
    employee_id: employeeId,
    path_type,
    path: encodedPath,
    photo,
  });

  return result;
};

export const getPathsByEmployee = async (employeeId) => {
  return await Path.findAll({
    where: { employee_id: employeeId },
    order: [["created_at", "DESC"]],
    raw: true,
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

      decodedPath = decoded.map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }

    return {
      ...item.toJSON(),
      path: decodedPath,
    };
  });
};

export const updateLandForCallVerify = async (id, data, employeeId) => {
  const t = await sequelize.transaction();

  try {
    const land = await Land.findByPk(id);
    if (!land) throw new Error("Land not found");

    const {
      farmerDetails,
      landDetails,
      gps,
      media,
      documents,
      ...landData
    } = data;

    await land.update(
      {
        ...landData,
        call_verification_by: employeeId,
      },
      { transaction: t }
    );

    if (farmerDetails) {
      const existing = await FarmerDetails.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(farmerDetails, { transaction: t });
      } else {
        await FarmerDetails.create(
          { ...farmerDetails, land_id: id },
          { transaction: t }
        );
      }
    }

    if (landDetails) {
      const existing = await LandDetails.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(landDetails, { transaction: t });
      } else {
        await LandDetails.create(
          { ...landDetails, land_id: id },
          { transaction: t }
        );
      }
    }

    if (gps) {
      const existing = await LandGPS.findOne({ where: { land_id: id } });

      if (existing) {
        await existing.update(gps, { transaction: t });
      } else {
        await LandGPS.create(
          { ...gps, land_id: id },
          { transaction: t }
        );
      }
    }

    if (media) {
      await LandMedia.destroy({ where: { land_id: id }, transaction: t });

      const mediaData = media.map((m) => ({
        ...m,
        land_id: id,
      }));

      await LandMedia.bulkCreate(mediaData, { transaction: t });
    }

    if (documents) {
      await LandDocuments.destroy({ where: { land_id: id }, transaction: t });

      const docData = documents.map((d) => ({
        ...d,
        land_id: id,
      }));

      await LandDocuments.bulkCreate(docData, { transaction: t });
    }

    await t.commit();

    return await getLandById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getPendingCallVerificationLands = async (status) => {
  return await Land.findAll({
    where: {
      call_verification_status: status,
      form_status: "complete",
    },
    include: [
      { model: FarmerDetails, as: "farmerDetails" },
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getPendingPhysicalVerificationLands = async (status) => {
  return await Land.findAll({
    where: {
      call_verification_status: "complete",
      physcial_verification_status: status,
    },
    include: [
      { model: FarmerDetails, as: "farmerDetails" },
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getPendingFinalVerificationLands = async (status) => {
  return await Land.findAll({
    where: {
      physcial_verification_status: "complete",
      verification_status: status,
    },
    include: [
      { model: FarmerDetails, as: "farmerDetails" },
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
    order: [["created_at", "DESC"]],
  });
};

