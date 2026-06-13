import * as roleService from "../service/roleService.js";

export const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const role = await roleService.createRole(name.trim());
    return res.status(201).json({ message: "Role created successfully", data: role });
  } catch (error) {
    if (error.message === "Role with this name already exists") {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    return res.status(200).json({ message: "Roles fetched successfully", data: roles });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return res.status(200).json({ message: "Role fetched successfully", data: role });
  } catch (error) {
    if (error.message === "Role not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const role = await roleService.updateRole(req.params.id, name.trim());
    return res.status(200).json({ message: "Role updated successfully", data: role });
  } catch (error) {
    if (error.message === "Role not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Role with this name already exists") {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    await roleService.deleteRole(req.params.id);
    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    if (error.message === "Role not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};