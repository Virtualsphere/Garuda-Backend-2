import * as buyerService from "../service/buyerService.js";
import * as landService from "../service/landService.js";

export const signup = async (req, res) => {
  try {
    const buyer = await buyerService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: buyer,
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Name, email and password are required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { buyer, accessToken, refreshToken } = await buyerService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: buyer,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error.message === "Email and password are required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
    if (error.message === "Refresh token required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "Invalid refresh token" || error.message === "Refresh token expired") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    const result = await buyerService.getUserById(id);
    return res.status(200).json({
      success: true,
      message: "User data fetch successfully",
      data: result
    });
  } catch (error) {
    if (error.message === "Buyer not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBuyer = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const updatedBuyer = await buyerService.updateBuyer(id, req.body);

    res.status(200).json({
      success: true,
      message: "Buyer updated successfully",
      data: updatedBuyer,
    });
  } catch (error) {
    if (error.message === "Buyer not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBuyer = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    await buyerService.deleteBuyer(id);

    res.status(200).json({
      success: true,
      message: "Buyer deleted successfully",
    });
  } catch (error) {
    if (error.message === "Buyer not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
    if (error.message === "Refresh token not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllLandsForUser = async (req, res) => {
  try {
    const lands = await landService.getAllLandsForUser();
  
    res.status(200).json({
      success: true,
      data: lands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLandByIdForUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Land ID is required",
      });
    }
    
    const lands = await landService.getLandByIdForUser(id);
  
    res.status(200).json({
      success: true,
      data: lands,
    });
  } catch (error) {
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createWishList = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    const data = req.body;
    if (!data.land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }
    
    const result = await buyerService.createWishList(userId, data);
    return res.status(201).json({
      success: true,
      message: "Land Added to Wishlist Successfully",
      data: result
    });
  } catch (error) {
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getWishListByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    const result = await buyerService.getWishListByUser(userId);
    return res.status(200).json({
      success: true,
      message: "Wish list fetched successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteWishList = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    const { landIds } = req.body;
    if (!landIds || (Array.isArray(landIds) && landIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "landIds is required"
      });
    }
    
    await buyerService.deleteWishList(userId, landIds);
    return res.status(200).json({
      success: true,
      message: "Wishlist deleted successfully"
    });
  } catch (error) {
    if (error.message === "Wishlist items not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteWishListById = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Wishlist ID is required"
      });
    }
    
    await buyerService.deleteWishListById(id);
    return res.status(200).json({
      success: true,
      message: "Wishlist deleted successfully"
    });
  } catch (error) {
    if (error.message === "Wishlist item not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const isWishListed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "Land ID is required"
      });
    }

    const result = await buyerService.isWishListed(userId, landId);

    return res.status(200).json({
      success: true,
      isWishListed: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message 
    });
  }
};

export const createAvailibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!req.body.land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }
    
    const result = await buyerService.createAvailibility(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Availability created",
      data: result,
    });
  } catch (error) {
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getAvailibilityByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    const result = await buyerService.getAvailibilityByUser(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updateAvailibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId, status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required"
      });
    }

    const result = await buyerService.updateAvailibility(userId, landId, status);

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Availability not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deleteAvailibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    await buyerService.deleteAvailibility(userId, landId);

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    if (error.message === "Availability not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const createCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!req.body.land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }

    const result = await buyerService.createCart(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Added to cart",
      data: result,
    });
  } catch (error) {
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getCartByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }

    const result = await buyerService.getCartByUser(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deleteCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landIds || (Array.isArray(landIds) && landIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "landIds is required"
      });
    }

    await buyerService.deleteCart(userId, landIds);

    return res.status(200).json({
      success: true,
      message: "Removed from cart",
    });
  } catch (error) {
    if (error.message === "Cart items not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const createPrimaryVisit = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    const { land_id, visit_date, time } = req.body;
    if (!land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }
    if (!visit_date) {
      return res.status(400).json({
        success: false,
        message: "visit_date is required"
      });
    }
    if (!time) {
      return res.status(400).json({
        success: false,
        message: "time is required"
      });
    }

    const result = await buyerService.createPrimaryVisit(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Visit scheduled",
      data: result,
    });
  } catch (error) {
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getPrimaryVisitsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }

    const result = await buyerService.getPrimaryVisitsByUser(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deletePrimaryVisit = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Visit ID is required"
      });
    }

    await buyerService.deletePrimaryVisit(id);

    return res.status(200).json({
      success: true,
      message: "Visit deleted",
    });
  } catch (error) {
    if (error.message === "Primary visit not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const createShortlisting = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!req.body.land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }

    const result = await buyerService.createShortlisting(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Shortlisted successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Already shortlisted") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getShortlistingByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }

    const result = await buyerService.getShortlistingByUser(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deleteShortlisting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    await buyerService.deleteShortlisting(userId, landId);

    return res.status(200).json({
      success: true,
      message: "Removed from shortlist",
    });
  } catch (error) {
    if (error.message === "Shortlisting not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const isShortlisted = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    const result = await buyerService.isShortlisted(userId, landId);

    return res.status(200).json({ 
      success: true,
      isShortlisted: result 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const createFinalList = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!req.body.land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }

    const result = await buyerService.createFinalList(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Added to final list",
      data: result,
    });
  } catch (error) {
    if (error.message === "Already in final list") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getFinalListByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }

    const result = await buyerService.getFinalListByUser(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deleteFinalList = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    await buyerService.deleteFinalList(userId, landId);

    return res.status(200).json({
      success: true,
      message: "Removed from final list",
    });
  } catch (error) {
    if (error.message === "Final list item not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const isFinalListed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    const result = await buyerService.isFinalListed(userId, landId);

    return res.status(200).json({ 
      success: true,
      isFinalListed: result 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const createPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    const { land_id, amount } = req.body;
    if (!land_id) {
      return res.status(400).json({
        success: false,
        message: "land_id is required"
      });
    }
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "amount is required"
      });
    }

    const result = await buyerService.createPayment(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Payment created",
      data: result,
    });
  } catch (error) {
    if (error.message === "Land not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getPaymentsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }

    const result = await buyerService.getPaymentsByUser(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getPaymentByLand = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    const result = await buyerService.getPaymentByLand(userId, landId);

    return res.status(200).json({ 
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === "Payment not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "landId is required"
      });
    }

    const result = await buyerService.updatePayment(userId, landId, req.body);

    return res.status(200).json({
      success: true,
      message: "Payment updated",
      data: result,
    });
  } catch (error) {
    if (error.message === "Payment not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found"
      });
    }
    
    if (!landIds || (Array.isArray(landIds) && landIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "landIds is required"
      });
    }

    await buyerService.deletePayment(userId, landIds);

    return res.status(200).json({
      success: true,
      message: "Payment deleted",
    });
  } catch (error) {
    if (error.message === "Payment not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};