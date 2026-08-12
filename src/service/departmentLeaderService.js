import DepartmentLeader from "../model/departmentLeaderModal.js";

export const setAllotment = async (employeeId, leaderId, departmentType) => {
  const existing = await DepartmentLeader.findOne({
    where: { employee_id: employeeId, department_type: departmentType },
  });

  if (existing) {
    await existing.update({ leader_id: leaderId });
    return existing;
  }

  return await DepartmentLeader.create({
    employee_id: employeeId,
    leader_id: leaderId,
    department_type: departmentType,
  });
};

export const getRoster = async (leaderId, departmentType) => {
  return await DepartmentLeader.findAll({
    where: { leader_id: leaderId, department_type: departmentType },
    order: [["created_at", "DESC"]],
  });
};

export const removeAllotment = async (employeeId, departmentType) => {
  const existing = await DepartmentLeader.findOne({
    where: { employee_id: employeeId, department_type: departmentType },
  });
  if (!existing) throw new Error("Allotment not found");

  await existing.destroy();
  return true;
};

export const getDepartmentTree = async (departmentType) => {
  return await DepartmentLeader.findAll({
    where: { department_type: departmentType },
    order: [["created_at", "DESC"]],
  });
};
