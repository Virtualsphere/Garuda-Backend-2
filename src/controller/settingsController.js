import * as settingsService from "../service/settingsService.js";

export const getAllSettings = async (req, res) => {
  try {
    const settings = await settingsService.getAllSettings();
    return res.status(200).json({ message: "Settings fetched successfully", data: settings });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getSettingByKey = async (req, res) => {
  try {
    const setting = await settingsService.getSettingByKey(req.params.key);
    return res.status(200).json({ message: "Setting fetched successfully", data: setting });
  } catch (error) {
    if (error.message === "Setting not found") {
      return res.status(200).json({ message: "Setting not found", data: null });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const upsertSetting = async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ message: "Setting value is required" });
    }

    const setting = await settingsService.upsertSetting(req.params.key, value);
    return res.status(200).json({ message: "Setting saved successfully", data: setting });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
