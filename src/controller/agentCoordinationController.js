import * as agentCoordinationService from "../service/agentCoordinationService.js";

// Rule violations carry their own status (409) from the service; anything
// without one is treated as a bad request.
const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.statusCode || fallbackStatus).json({ message: error.message });

export const getCoordinationLoad = async (req, res) => {
  try {
    const result = await agentCoordinationService.getCoordinationLoad();
    return res
      .status(200)
      .json({ message: "Coordination load fetched successfully", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const assignCoordinationExecutive = async (req, res) => {
  try {
    const result = await agentCoordinationService.assignCoordinationExecutive(req.body);
    return res
      .status(200)
      .json({ message: "Agents reassigned successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};
