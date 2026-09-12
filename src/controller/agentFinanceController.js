import * as agentFinanceService from "../service/agentFinanceService.js";

// Rule violations carry their own status (409) from the service; anything
// without one is treated as a bad request.
const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.statusCode || fallbackStatus).json({ message: error.message });

export const listTransactions = async (req, res) => {
  try {
    const result = await agentFinanceService.listTransactions(req.query);
    return res.status(200).json({
      message: "Transactions fetched successfully",
      count: result.length,
      result,
    });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getTransaction = async (req, res) => {
  try {
    const result = await agentFinanceService.getTransactionById(req.params.id);
    return res
      .status(200)
      .json({ message: "Transaction fetched successfully", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const createTransaction = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });

    const result = await agentFinanceService.createTransaction(employeeId, req.body);
    return res
      .status(201)
      .json({ message: "Transaction recorded successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const result = await agentFinanceService.updateTransaction(
      req.params.id,
      req.body
    );
    return res
      .status(200)
      .json({ message: "Transaction updated successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const employeeId = req.user?.id;
    const result = await agentFinanceService.updateTransactionStatus(
      req.params.id,
      req.body?.status,
      employeeId
    );
    return res.status(200).json({ message: "Transaction status updated", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const result = await agentFinanceService.deleteTransaction(req.params.id);
    return res
      .status(200)
      .json({ message: "Transaction deleted successfully", result });
  } catch (error) {
    return fail(res, error);
  }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const result = await agentFinanceService.getFinanceSummary(req.query);
    return res.status(200).json({ message: "Finance summary fetched", result });
  } catch (error) {
    return fail(res, error, 500);
  }
};

export const getAgentLedger = async (req, res) => {
  try {
    const result = await agentFinanceService.getAgentLedger(req.params.agentId);
    return res.status(200).json({ message: "Agent ledger fetched", result });
  } catch (error) {
    return fail(res, error, 404);
  }
};
