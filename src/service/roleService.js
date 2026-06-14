import Role from "../model/roleModel.js";

export const createRole = async (name) => {
  const existing = await Role.findOne({ where: { name } });
  if (existing) throw new Error("Role with this name already exists");

  return await Role.create({ name });
};

export const getAllRoles = async () => {
  return await Role.findAll({ order: [["created_at", "DESC"]] });
};

export const getRoleById = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new Error("Role not found");
  return role;
};

export const updateRole = async (id, name) => {
  const role = await Role.findByPk(id);
  if (!role) throw new Error("Role not found");

  const duplicate = await Role.findOne({ where: { name } });
  if (duplicate && duplicate.id !== Number(id)) {
    throw new Error("Role with this name already exists");
  }

  await role.update({ name });
  return role;
};

export const deleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new Error("Role not found");

  await role.destroy();
  return true;
};