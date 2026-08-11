import Setting from "../model/settingsModel.js";

export const getAllSettings = async () => {
  return await Setting.findAll({ order: [["key", "ASC"]] });
};

export const getSettingByKey = async (key) => {
  const setting = await Setting.findOne({ where: { key } });
  if (!setting) throw new Error("Setting not found");
  return setting;
};

export const upsertSetting = async (key, value) => {
  const existing = await Setting.findOne({ where: { key } });

  if (existing) {
    await existing.update({ value });
    return existing;
  }

  return await Setting.create({ key, value });
};
