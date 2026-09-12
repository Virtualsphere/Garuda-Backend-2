import * as agentObservationService from "../service/agentObservationService.js";

// Rule violations carry their own status (409) from the service; anything
// without one is treated as a bad request.
const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.statusCode || fallbackStatus).json({ message: error.message });

export const listObservations = async (req, res) => {
  try {
    const result = await agentObservationService.listObservations(req.query);
    return res.status(200).json({
      message: "Observations fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getObservation = async (req, res) => {
  try {
    const result = await agentObservationService.getObservationById(req.params.id);
    return res
      .status(200)
      .json({ message: "Observation fetched successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const assignObservation = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentObservationService.assignObservation(
      employeeId,
      req.body
    );
    return res
      .status(201)
      .json({ message: "Observation assigned successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const assignObservationsBulk = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentObservationService.assignObservationsBulk(
      employeeId,
      req.body
    );
    return res.status(201).json({
      message: `${result.assigned.length} observation(s) assigned`,
      result,
    });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateObservation = async (req, res) => {
  try {
    const result = await agentObservationService.updateObservation(
      req.params.id,
      req.body
    );
    return res
      .status(200)
      .json({ message: "Observation updated successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const removeObservation = async (req, res) => {
  try {
    const result = await agentObservationService.removeObservation({
      id: req.params.id,
      landId: req.body?.landId,
      agentId: req.body?.agentId,
    });
    return res
      .status(200)
      .json({ message: "Observation removed successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const submitInformation = async (req, res) => {
  try {
    const result = await agentObservationService.submitObservationInformation(
      req.body
    );
    return res
      .status(201)
      .json({ message: "Observation information submitted", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const listSubmissions = async (req, res) => {
  try {
    const result = await agentObservationService.listSubmissions(req.query);
    return res.status(200).json({
      message: "Submissions fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const verifySubmission = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentObservationService.verifySubmission(
      req.params.id,
      req.body,
      employeeId
    );
    return res.status(200).json({ message: "Submission verified", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const markDueObservations = async (req, res) => {
  try {
    const result = await agentObservationService.markDueObservations();
    return res.status(200).json({ message: "Due observations marked", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};
