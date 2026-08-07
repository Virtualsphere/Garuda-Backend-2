import Access from "../model/accessModel.js";
import { Op } from "sequelize";

export const checkAccess = async (role, appType) => {
  if (!role || !appType) return false;

  // Prefer exact match first (legacy data).
  const exact = await Access.findOne({
    where: { role, app_type: appType },
  });
  if (exact) return true;

  // Fall back to case-insensitive role match.
  const access = await Access.findOne({
    where: {
      app_type: appType,
      role: { [Op.iLike]: String(role).trim() },
    },
  });

  return !!access;
};

export const createAccess = async (data) => {
  return await Access.create(data);
};

export const getAllAccess = async () => {
  return await Access.findAll({
    order: [["role", "ASC"]],
  });
};
