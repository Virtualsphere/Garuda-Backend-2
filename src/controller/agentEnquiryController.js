import * as agentEnquiryService from "../service/agentEnquiryService.js";

// Rule violations carry their own status (409) from the service; anything
// without one is treated as a bad request.
const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.statusCode || fallbackStatus).json({ message: error.message });

export const listEnquiries = async (req, res) => {
  try {
    const result = await agentEnquiryService.listEnquiries(req.query);
    return res.status(200).json({
      message: "Enquiries fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getEnquiry = async (req, res) => {
  try {
    const result = await agentEnquiryService.getEnquiryById(req.params.id);
    return res.status(200).json({ message: "Enquiry fetched successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const createEnquiry = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });

    const result = await agentEnquiryService.createEnquiry(employeeId, req.body);
    return res.status(201).json({ message: "Enquiry logged successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateEnquiry = async (req, res) => {
  try {
    const result = await agentEnquiryService.updateEnquiry(req.params.id, req.body);
    return res.status(200).json({ message: "Enquiry updated successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await agentEnquiryService.updateEnquiryStatus(
      req.params.id,
      status,
      notes
    );
    return res.status(200).json({ message: "Enquiry status updated", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const convertEnquiry = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentEnquiryService.convertEnquiryToCandidate(
      req.params.id,
      employeeId
    );
    return res
      .status(201)
      .json({ message: "Enquiry converted to candidate", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const result = await agentEnquiryService.deleteEnquiry(req.params.id);
    return res.status(200).json({ message: "Enquiry deleted successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

/** Phone lookup used by the log-enquiry form to surface a known caller. */
export const matchCaller = async (req, res) => {
  try {
    const result = await agentEnquiryService.matchCallerByPhone(req.query.phone);
    return res.status(200).json({ message: "Caller lookup complete", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getEnquiryStats = async (req, res) => {
  try {
    const result = await agentEnquiryService.getEnquiryStats();
    return res.status(200).json({ message: "Enquiry stats fetched", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};
