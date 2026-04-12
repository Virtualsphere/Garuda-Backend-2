import {
  Land,
  FarmerDetails,
  LandDetails,
  LandGPS,
  LandMedia,
  LandDocuments,
  Employee,
  AssignedVillage
} from "../model/associationModel.js";

import sequelize from "../db/db.js";

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
    if (media.length) {
      const mediaData = media.map((m) => ({
        ...m,
        land_id: land.id,
      }));

      await LandMedia.bulkCreate(mediaData, { transaction: t });
    }

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

export const getAllLandsForUser= async ()=>{
  return await Land.findAll({
    include: [
      { model: LandDetails, as: "landDetails" },
      { model: LandGPS, as: "gps" },
      { model: LandMedia, as: "media" },
      { model: LandDocuments, as: "documents" },
    ],
    order: [["created_at", "DESC"]],
  });
}

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

export const updateLand = async (id, data, employeeId) => {
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

    // Update Land
    await land.update(
      {
        ...landData,
        verified_by: employeeId,
      },
      { transaction: t }
    );

    // Farmer Details
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

    // Land Details
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

    // GPS
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

    // Replace Media
    if (media) {
      await LandMedia.destroy({ where: { land_id: id }, transaction: t });

      const mediaData = media.map((m) => ({
        ...m,
        land_id: id,
      }));

      await LandMedia.bulkCreate(mediaData, { transaction: t });
    }

    // Replace Documents
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

export const createAssignedVillage = async (target, assignedStatus, assignedEmployeeId, village, mandal, physicalVerified) => {
  try {
    const assignedVillage = await AssignedVillage.create({ target, assigned_status: assignedStatus, village, mandal, assigned_employee_id: assignedEmployeeId, physical_verified: physicalVerified });
    return assignedVillage;
  } catch (error) {
    throw error;
  }
};

export const getAllAssignedVillages = async () => {
  return await AssignedVillage.findAll({
    include: [
      {
        model: Employee,
        as: "assigned",
      },
    ],
    order: [["created_at", "DESC"]],
  });
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

  return assignedVillage;
};

export const updateAssignedVillage = async (data) => {
  const t = await sequelize.transaction();

  try {
    const assignedVillage = await AssignedVillage.findByPk(data.id);

    if (!assignedVillage) {
      throw new Error("AssignedVillage not found");
    }

    await assignedVillage.update(data, { transaction: t });

    await t.commit();

    return await getAssignedVillageById(id);
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
  const assignedVillage = await AssignedVillage.findAll({
    where: { assigned_employee_id: employeeId, assigned_status: "ongoing" },
    include: [
      {
        model: Employee,
        as: "assigned",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  if (!assignedVillage) {
    throw new Error("AssignedVillage not found or not ongoing");
  }

  const data = assignedVillage.toJSON();

  const getCount = (field) => {
    if (!field) return 0;

    if (Array.isArray(field)) return field.length;

    if (typeof field === "object") return Object.keys(field).length;

    return 0;
  };

  return {
    ...data,

    land_created_ids: data.land_created || [],
    land_created_count: getCount(data.land_created),

    complete_details_ids: data.complete_details || [],
    complete_details_count: getCount(data.complete_details),

    verified_ids: data.verified || [],
    verified_count: getCount(data.verified),

    physical_verified_ids: data.physical_verified || [],
    physical_verified_count: getCount(data.physical_verified),
  };
};

