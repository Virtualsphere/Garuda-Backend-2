import * as callSignalService from "../service/callSignalService.js";

export const createCallSignal = async (req, res) => {
  try {
    const signal = await callSignalService.createCallSignal(req.body);
    return res.status(201).json({ message: "Call signal created successfully", data: signal });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getAllCallSignals = async (req, res) => {
  try {
    const { department_type, employee_id, direction, status, land_id } = req.query;
    const signals = await callSignalService.getAllCallSignals({ department_type, employee_id, direction, status, land_id });
    return res.status(200).json({ message: "Call signals fetched successfully", data: signals });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCallSignalMetrics = async (req, res) => {
  try {
    const { department_type, employee_id, land_id } = req.query;
    const metrics = await callSignalService.getCallSignalMetrics({ department_type, employee_id, land_id });
    return res.status(200).json({ message: "Call signal metrics fetched successfully", data: metrics });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateCallSignalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const signal = await callSignalService.updateCallSignalStatus(req.params.id, status);
    return res.status(200).json({ message: "Call signal status updated successfully", data: signal });
  } catch (error) {
    if (error.message === "Call signal not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
