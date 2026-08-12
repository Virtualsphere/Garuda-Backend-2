import CallSignal from "../model/callSignalModel.js";

export const createCallSignal = async (data) => {
  const { department_type } = data;
  if (!department_type) throw new Error("department_type is required");

  return await CallSignal.create(data);
};

export const getAllCallSignals = async (filters = {}) => {
  const { department_type, employee_id, direction, status, land_id } = filters;

  const whereClause = {};
  if (department_type) whereClause.department_type = department_type;
  if (employee_id) whereClause.employee_id = employee_id;
  if (direction) whereClause.direction = direction;
  if (status) whereClause.status = status;
  if (land_id) whereClause.land_id = land_id;

  return await CallSignal.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]],
  });
};

export const getCallSignalMetrics = async (filters = {}) => {
  const { department_type, employee_id, land_id } = filters;

  const whereClause = {};
  if (department_type) whereClause.department_type = department_type;
  if (employee_id) whereClause.employee_id = employee_id;
  if (land_id) whereClause.land_id = land_id;

  const calls = await CallSignal.findAll({ where: whereClause });

  const totalTalkTimeSeconds = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
  const missedCount = calls.filter((c) => c.missed).length;
  const attendedCount = calls.length - missedCount;

  return { totalTalkTimeSeconds, attendedCount, missedCount };
};

export const updateCallSignalStatus = async (id, status) => {
  const call = await CallSignal.findByPk(id);
  if (!call) throw new Error("Call signal not found");

  await call.update({ status });
  return call;
};
