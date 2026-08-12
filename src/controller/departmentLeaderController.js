import * as departmentLeaderService from "../service/departmentLeaderService.js";

export const setAllotment = async (req, res) => {
  try {
    const { employeeId, leaderId, departmentType } = req.body;

    if (!employeeId || !leaderId || !departmentType) {
      return res.status(400).json({ message: "employeeId, leaderId, and departmentType are required" });
    }

    const allotment = await departmentLeaderService.setAllotment(employeeId, leaderId, departmentType);
    return res.status(200).json({ message: "Allotment saved successfully", data: allotment });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getRoster = async (req, res) => {
  try {
    const { leaderId, departmentType } = req.query;

    if (!leaderId || !departmentType) {
      return res.status(400).json({ message: "leaderId and departmentType are required" });
    }

    const roster = await departmentLeaderService.getRoster(leaderId, departmentType);
    return res.status(200).json({ message: "Roster fetched successfully", data: roster });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const removeAllotment = async (req, res) => {
  try {
    const { employeeId, departmentType } = req.body;

    if (!employeeId || !departmentType) {
      return res.status(400).json({ message: "employeeId and departmentType are required" });
    }

    await departmentLeaderService.removeAllotment(employeeId, departmentType);
    return res.status(200).json({ message: "Allotment removed successfully" });
  } catch (error) {
    if (error.message === "Allotment not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getDepartmentTree = async (req, res) => {
  try {
    const { departmentType } = req.query;

    if (!departmentType) {
      return res.status(400).json({ message: "departmentType is required" });
    }

    const tree = await departmentLeaderService.getDepartmentTree(departmentType);
    return res.status(200).json({ message: "Department tree fetched successfully", data: tree });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
