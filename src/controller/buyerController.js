import * as buyerService from "../service/buyerService.js";

/* =========================
   SIGNUP
========================= */
export const signup = async (req, res) => {
  try {
    const buyer = await buyerService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: buyer,
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
    const { buyer, accessToken, refreshToken } =
      await buyerService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: buyer,
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
   REFRESH ACCESS TOKEN
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

    const data = await buyerService.refreshAccessToken(refreshToken);

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
   UPDATE BUYER
========================= */
export const updateBuyer = async (req, res) => {
  try {
    const id = req.user?.id;

    const updatedBuyer = await buyerService.updateBuyer(id, req.body);

    res.status(200).json({
      success: true,
      message: "Buyer updated successfully",
      data: updatedBuyer,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE BUYER
========================= */
export const deleteBuyer = async (req, res) => {
  try {
    const id = req.user?.id;

    await buyerService.deleteBuyer(id);

    res.status(200).json({
      success: true,
      message: "Buyer deleted successfully",
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

    await buyerService.logout(refreshToken);

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