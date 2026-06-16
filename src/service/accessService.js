import Access from "../model/accessModel.js";

export const checkAccess = async (role, appType) => {
  const access = await Access.findOne({
    where: {
      role: role,
      app_type: appType,
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
