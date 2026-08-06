import * as permissionService from "../service/permissionService.js";

const checkPermission = (permissionKey) => async (req, res, next) => {
  try {
    const { id, type } = req.user;
    const { isAdmin, keys } = await permissionService.getEffectivePermissions(id, type);

    if (isAdmin || keys.includes(permissionKey)) return next();

    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Permission check failed",
      error: error.message,
    });
  }
};

export default checkPermission;
