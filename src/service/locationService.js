import State from "../model/stateModel.js";
import District from "../model/districtModel.js";
import Mandal from "../model/mandalModel.js";
import Village from "../model/villageModel.js";

/* =====================================================
   CREATE
===================================================== */

// Create State
export const createState = async ({ name }) => {
  if (!name) throw new Error("State name is required");

  return await State.create({ name });
};

// Create District
export const createDistrict = async ({ name, state_id }) => {
  if (!name || !state_id)
    throw new Error("Name and state_id are required");

  const state = await State.findByPk(state_id);
  if (!state) throw new Error("State not found");

  return await District.create({ name, state_id });
};

// Create Mandal
export const createMandal = async ({ name, district_id }) => {
  if (!name || !district_id)
    throw new Error("Name and district_id are required");

  const district = await District.findByPk(district_id);
  if (!district) throw new Error("District not found");

  return await Mandal.create({ name, district_id });
};

// Create Village
export const createVillage = async ({ name, mandal_id }) => {
  if (!name || !mandal_id)
    throw new Error("Name and mandal_id are required");

  const mandal = await Mandal.findByPk(mandal_id);
  if (!mandal) throw new Error("Mandal not found");

  return await Village.create({ name, mandal_id });
};

/* =====================================================
   GET (FULL HIERARCHY)
===================================================== */

export const getAllLocations = async () => {
  return await State.findAll({
    order: [["name", "ASC"]],
    include: [
      {
        model: District,
        as: "districts",
        required: false,
        include: [
          {
            model: Mandal,
            as: "mandals",
            required: false,
            include: [
              {
                model: Village,
                as: "villages",
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });
};

/* =====================================================
   GET BY ID
===================================================== */

export const getStateById = async (id) => {
  const state = await State.findByPk(id, {
    include: [
      {
        model: District,
        as: "districts",
        include: [
          {
            model: Mandal,
            as: "mandals",
            include: [
              {
                model: Village,
                as: "villages",
              },
            ],
          },
        ],
      },
    ],
  });

  if (!state) throw new Error("State not found");

  return state;
};

/* =====================================================
   FILTER APIs (FOR DROPDOWNS)
===================================================== */

// Get districts by state
export const getDistrictsByState = async (state_id) => {
  return await District.findAll({
    where: { state_id },
    order: [["name", "ASC"]],
  });
};

// Get mandals by district
export const getMandalsByDistrict = async (district_id) => {
  return await Mandal.findAll({
    where: { district_id },
    order: [["name", "ASC"]],
  });
};

// Get villages by mandal
export const getVillagesByMandal = async (mandal_id) => {
  return await Village.findAll({
    where: { mandal_id },
    order: [["name", "ASC"]],
  });
};

/* =====================================================
   UPDATE
===================================================== */

export const updateState = async (id, data) => {
  const state = await State.findByPk(id);
  if (!state) throw new Error("State not found");

  await state.update(data);
  return state;
};

export const updateDistrict = async (id, data) => {
  const district = await District.findByPk(id);
  if (!district) throw new Error("District not found");

  await district.update(data);
  return district;
};

export const updateMandal = async (id, data) => {
  const mandal = await Mandal.findByPk(id);
  if (!mandal) throw new Error("Mandal not found");

  await mandal.update(data);
  return mandal;
};

export const updateVillage = async (id, data) => {
  const village = await Village.findByPk(id);
  if (!village) throw new Error("Village not found");

  await village.update(data);
  return village;
};

/* =====================================================
   DELETE
===================================================== */

export const deleteState = async (id) => {
  const state = await State.findByPk(id);
  if (!state) throw new Error("State not found");

  await state.destroy();
  return true;
};

export const deleteDistrict = async (id) => {
  const district = await District.findByPk(id);
  if (!district) throw new Error("District not found");

  await district.destroy();
  return true;
};

export const deleteMandal = async (id) => {
  const mandal = await Mandal.findByPk(id);
  if (!mandal) throw new Error("Mandal not found");

  await mandal.destroy();
  return true;
};

export const deleteVillage = async (id) => {
  const village = await Village.findByPk(id);
  if (!village) throw new Error("Village not found");

  await village.destroy();
  return true;
};