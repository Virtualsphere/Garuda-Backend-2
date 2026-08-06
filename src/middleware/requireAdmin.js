import { isAdmin } from "../service/permissionService.js";

const requireAdmin = (req, res, next) => {
  if (!isAdmin(req.user?.type)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
  return next();
};

export default requireAdmin;
