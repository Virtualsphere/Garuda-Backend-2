import * as permissionService from "../service/permissionService.js";
import * as employeeService from "../service/employeeService.js";

export const getCatalog = async (req, res) => {
  try {
    const catalog = await permissionService.getCatalog();
    return res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getRolePermissions = async (req, res) => {
  try {
    const keys = await permissionService.getRolePermissions(req.params.roleName);
    return res.status(200).json({ success: true, data: { permissions: keys } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const setRolePermissions = async (req, res) => {
  try {
    const { permissionKeys } = req.body;
    if (!Array.isArray(permissionKeys)) {
      return res.status(400).json({ success: false, message: "permissionKeys must be an array" });
    }

    const keys = await permissionService.setRolePermissions(req.params.roleName, permissionKeys);
    return res.status(200).json({ success: true, message: "Role permissions updated", data: { permissions: keys } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployeePermissions = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.employeeId);
    const data = await permissionService.getEmployeePermissions(employee.id, employee.role);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message === "Employee not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const setEmployeePermissions = async (req, res) => {
  try {
    const { overrides } = req.body;
    if (!Array.isArray(overrides)) {
      return res.status(400).json({ success: false, message: "overrides must be an array" });
    }
    const invalidType = overrides.find((o) => !["ALLOW", "DENY"].includes(o.type));
    if (invalidType) {
      return res.status(400).json({ success: false, message: "Each override must have type ALLOW or DENY" });
    }

    const employee = await employeeService.getEmployeeById(req.params.employeeId);
    const data = await permissionService.setEmployeeOverrides(employee.id, overrides, employee.role);
    return res.status(200).json({ success: true, message: "Employee permissions updated", data });
  } catch (error) {
    if (error.message === "Employee not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyPermissions = async (req, res) => {
  try {
    const { id, type } = req.user;
    const data = await permissionService.getEffectivePermissions(id, type);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
