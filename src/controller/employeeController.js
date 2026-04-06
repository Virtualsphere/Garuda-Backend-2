import * as employeeService from "../service/employeeService.js";

/* =========================
   SIGNUP
========================= */
export const signup = async (req, res) => {
  try {
    const employee = await employeeService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { employee, accessToken, refreshToken } =
      await employeeService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: employee,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   REFRESH TOKEN
========================= */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const data = await employeeService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      accessToken: data.accessToken,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE EMPLOYEE
========================= */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.user?.id;

    const updatedEmployee = await employeeService.updateEmployee(
      id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE EMPLOYEE
========================= */
export const deleteEmployee = async (req, res) => {
  try {
    const id = req.user?.id;

    await employeeService.deleteEmployee(id); // (your service name)

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    await employeeService.logout(refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};