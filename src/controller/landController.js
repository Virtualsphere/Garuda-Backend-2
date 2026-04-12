import * as landService from "../service/landService.js";

export const createLand = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const land = await landService.createLand(req.body, employeeId);

    res.status(201).json({
      success: true,
      message: "Land created successfully",
      data: land,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllLands = async (req, res) => {
  try {
    const lands = await landService.getAllLands();

    res.status(200).json({
      success: true,
      data: lands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLandById = async (req, res) => {
  try {
    const { id } = req.params;

    const land = await landService.getLandById(id);

    res.status(200).json({
      success: true,
      data: land,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLand = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.id; // verifier

    const updatedLand = await landService.updateLand(
      id,
      req.body,
      employeeId
    );

    res.status(200).json({
      success: true,
      message: "Land updated successfully",
      data: updatedLand,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteLand = async (req, res) => {
  try {
    const { id } = req.params;

    await landService.deleteLand(id);

    res.status(200).json({
      success: true,
      message: "Land deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const filterLands = async (req, res) => {
  try {
    const filters = req.query;

    const lands = await landService.filterLands(filters);

    res.status(200).json({
      success: true,
      data: lands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};