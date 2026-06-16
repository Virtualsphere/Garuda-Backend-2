import * as accessService from '../service/accessService.js'

export const addAccess = async (req, res) => {
  try {
    const access = await accessService.createAccess(req.body);

    return res.status(201).json({
      success: true,
      data: access,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const listAccess = async (req, res) => {
  try {
    const data = await accessService.getAllAccess();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const validateAccess = async (req, res) => {
  try {
    const { appType } = req.params;

    const role = req.user.type;

    const hasAccess = await accessService.checkAccess(role, appType);

    return res.status(200).json({
      success: true,
      hasAccess,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};