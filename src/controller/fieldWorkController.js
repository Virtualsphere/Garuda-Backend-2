import * as landService from "../service/landService.js";
import * as buyerService from "../service/buyerService.js";
import * as sessionService from '../service/sessionService.js'
import * as walletService from '../service/walletService.js'
import * as trainingService from '../service/trainingService.js'
import * as agentService from '../service/agentService.js'

export const createAssignedVillage = async (req, res) => {
  try {
    const {
      target,
      assignedStatus,
      assignedEmployeeId,
      village,
      mandal,
      physicalVerified = [],
    } = req.body;

    // ✅ basic validation
    if (!target || !assignedEmployeeId || !village || !mandal) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const result = await landService.createAssignedVillage(
      target,
      assignedStatus,
      assignedEmployeeId,
      village,
      mandal,
      physicalVerified
    );

    return res.status(201).json({
      message: `Assigned village successfully to employee ${result.assigned_employee_id}`,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};

export const getAssignedVillageByEmployee = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Unauthorized: Employee ID not found",
      });
    }

    const result = await landService.getAssignedVillagesByEmployee(employeeId);

    return res.status(200).json({
      message: "Assigned villages fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};

export const updateAssignedVillage = async (req, res) => {
  try {
    const data = req.body;

    if (!data.id) {
      return res.status(400).json({
        message: "ID is required",
      });
    }

    const result = await landService.updateAssignedVillage(data);

    return res.status(200).json({
      message: "Assigned village updated successfully",
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllAssignedVillages = async (req, res) => {
  try {
    const result = await landService.getAllAssignedVillages();

    return res.status(200).json({
      message: "All assigned villages fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getAssignedVillageById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await landService.getAssignedVillageById(id);

    return res.status(200).json({
      message: "Assigned village fetched successfully",
      result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const deleteAssignedVillage = async (req, res) => {
  try {
    const { id } = req.params;

    await landService.deleteAssignedVillage(id);

    return res.status(200).json({
      message: "Assigned village deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const startSessionController = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const session = await sessionService.startSession(employeeId, req.body);

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addExpenseController = async (req, res) => {
  try {
    const { sessionId, expenses } = req.body;

    const result = await sessionService.addSessionExpense(sessionId, expenses);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const endSessionController = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const session = await sessionService.endSession(employeeId, req.body);

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getSessionsController = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const sessions = await sessionService.getSessions(employeeId);

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const createPathController = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const result = await landService.createPath(employeeId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getPathsController = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const result = await landService.getPathsByEmployee(employeeId);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getWorkWallet = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    const data = await walletService.getWorkWalletByEmployee(
      employeeId,
      startDate,
      endDate
    );

    res.status(200).json({
      message: "Work wallet fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateWorkWalletStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Wallet id is required",
      });
    }

    const updatedWallet = await walletService.updateWorkWallet(id);

    res.status(200).json({
      message: "Work wallet status updated to COMPLETED",
      data: updatedWallet,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getTravelWallet = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    const data = await walletService.getTravelWalletByEmployee(employeeId);

    res.status(200).json({
      message: "Travel wallet fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updatePrimaryVisit = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { landId } = req.params;

    const updated = await buyerService.updatePrimaryVisitByEmployee(
      landId,
      employeeId,
      req.body
    );

    res.status(200).json({
      message: "Primary visit updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const assignEmployeeToVisit = async (req, res) => {
  try {
    const { userId, landId, employeeId } = req.body;

    const updated = await buyerService.updatePrimaryVisitByAdmin(
      userId,
      landId,
      employeeId
    );

    res.status(200).json({
      message: "Employee assigned successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const feedback = await buyerService.createLandFeedback(
      employeeId,
      req.body
    );

    res.status(201).json({
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const createTraining = async (req, res) => {
  try {
    const data = req.body;

    if (!data.land_verification) {
      return res.status(400).json({
        message: "land_verification video URL is required",
      });
    }

    const result = await trainingService.createTraining(data);

    return res.status(201).json({
      message: "Training created successfully",
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getTraining = async (req, res) => {
  try {
    const result = await trainingService.getTraining();

    return res.status(200).json({
      message: "Training fetched successfully",
      result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const updateTraining = async (req, res) => {
  try {
    const data = req.body;

    const result = await trainingService.updateTraining(data);

    return res.status(200).json({
      message: "Training updated successfully",
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteTraining = async (req, res) => {
  try {
    const { id } = req.params;

    await trainingService.deleteTraining(id);

    return res.status(200).json({
      message: "Training deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const createAgent = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await agentService.createAgent(employeeId, req.body);

    return res.status(201).json({
      message: "Agent created successfully",
      result,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getAgentsByLocation = async (req, res) => {
  try {
    const { state, district } = req.query;

    const result = await agentService.getAgentsByLocation({
      state,
      district,
    });

    return res.status(200).json({
      message: "Agents fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await agentService.updateAgent(id, req.body);

    return res.status(200).json({
      message: "Agent updated successfully",
      result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    await agentService.deleteAgent(id);

    return res.status(200).json({
      message: "Agent deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const getPrimaryVisitsByEmployee = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Unauthorized: Employee ID not found",
      });
    }

    const visits = await buyerService.getPrimaryVisitsByEmployee(employeeId);

    return res.status(200).json({
      message: "Primary visits fetched successfully",
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};

export const getLandFeedback = async (req, res) => {
  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Unauthorized: Employee ID not found",
      });
    }

    const feedback = await buyerService.getLandFeebBack(employeeId);

    return res.status(200).json({
      message: "Land feedback fetched successfully",
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};