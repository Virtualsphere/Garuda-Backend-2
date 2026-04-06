import * as locationService from "../service/locationService.js";

/* =========================
   CREATE
========================= */

// Create State
export const createState = async (req, res) => {
  try {
    const state = await locationService.createState(req.body);

    res.status(201).json({
      success: true,
      message: "State created successfully",
      data: state,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Create District
export const createDistrict = async (req, res) => {
  try {
    const district = await locationService.createDistrict(req.body);

    res.status(201).json({
      success: true,
      message: "District created successfully",
      data: district,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Mandal
export const createMandal = async (req, res) => {
  try {
    const mandal = await locationService.createMandal(req.body);

    res.status(201).json({
      success: true,
      message: "Mandal created successfully",
      data: mandal,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Village
export const createVillage = async (req, res) => {
  try {
    const village = await locationService.createVillage(req.body);

    res.status(201).json({
      success: true,
      message: "Village created successfully",
      data: village,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET FULL HIERARCHY
========================= */

export const getAllLocations = async (req, res) => {
  try {
    const data = await locationService.getAllLocations();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET STATE BY ID
========================= */

export const getStateById = async (req, res) => {
  try {
    const { id } = req.params;

    const state = await locationService.getStateById(id);

    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   FILTER APIs (DROPDOWNS)
========================= */

// Get districts by state
export const getDistrictsByState = async (req, res) => {
  try {
    const { state_id } = req.params;

    const districts = await locationService.getDistrictsByState(state_id);

    res.status(200).json({
      success: true,
      data: districts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get mandals by district
export const getMandalsByDistrict = async (req, res) => {
  try {
    const { district_id } = req.params;

    const mandals = await locationService.getMandalsByDistrict(district_id);

    res.status(200).json({
      success: true,
      data: mandals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get villages by mandal
export const getVillagesByMandal = async (req, res) => {
  try {
    const { mandal_id } = req.params;

    const villages = await locationService.getVillagesByMandal(mandal_id);

    res.status(200).json({
      success: true,
      data: villages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE
========================= */

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;

    const state = await locationService.updateState(id, req.body);

    res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: state,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const district = await locationService.updateDistrict(id, req.body);

    res.status(200).json({
      success: true,
      message: "District updated successfully",
      data: district,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMandal = async (req, res) => {
  try {
    const { id } = req.params;

    const mandal = await locationService.updateMandal(id, req.body);

    res.status(200).json({
      success: true,
      message: "Mandal updated successfully",
      data: mandal,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateVillage = async (req, res) => {
  try {
    const { id } = req.params;

    const village = await locationService.updateVillage(id, req.body);

    res.status(200).json({
      success: true,
      message: "Village updated successfully",
      data: village,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE
========================= */

export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    await locationService.deleteState(id);

    res.status(200).json({
      success: true,
      message: "State deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    await locationService.deleteDistrict(id);

    res.status(200).json({
      success: true,
      message: "District deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMandal = async (req, res) => {
  try {
    const { id } = req.params;

    await locationService.deleteMandal(id);

    res.status(200).json({
      success: true,
      message: "Mandal deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteVillage = async (req, res) => {
  try {
    const { id } = req.params;

    await locationService.deleteVillage(id);

    res.status(200).json({
      success: true,
      message: "Village deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};