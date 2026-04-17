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
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

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
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserById= async(req, res)=>{
  try {
    const id= req.user?.id;
    const result= await buyerService.getUserById(id);
    return res.status(200).json({
      message: "User data fetch successfully",
      result
    })
  } catch (error) {
    return res.status(500).json(error)
  }
}

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

export const getAllLandsForUser= async (req, res)=>{
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
}

export const getLandByIdForUser= async (req, res)=>{
  try {
    const { id } = req.params;
    const lands = await landService.getLandByIdForUser(id);
  
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
}

export const createWishList= async (req, res)=>{
  try {
    const userId= req.user?.id;
    const data= req.body;
    const result= await buyerService.createWishList(userId, data);
    return res.status(201).json({
      message: "Land Added to Wishlist Successfully",
      result
    })
  } catch (error) {
    return res.status(500).json(error);
  }
}

export const getWishListByUser= async (req, res)=>{
  try {
    const userId= req.user?.id;
    const result= await buyerService.getWishListByUser(userId);
    return res.status(200).json({
      message: "wish list fetch successfully",
      result
    });
  } catch (error) {
    return res.status(500).json(error);
  }
}

export const deleteWishList= async (req, res)=>{
  try {
    const userId= req.user?.id;
    const { landIds }= req.body;
    await buyerService.deleteWishList(userId, landIds);
    return res.status(200).json({
      message: "delete wish list successfully"
    })
  } catch (error) {
    return res.status(500).json(error)
  }
}

export const deleteWishListById= async (req, res)=>{
  try {
    const { id }= req.body;
    await buyerService.deleteWishListById(id);
    return res.status(200).json({
      message: "delete wish list successfully"
    })
  } catch (error) {
    return res.status(500).json(error)
  }
}

export const isWishListed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    const result = await buyerService.isWishListed(userId, landId);

    return res.status(200).json({
      success: true,
      isWishListed: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createAvailibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await buyerService.createAvailibility(userId, req.body);

    return res.status(201).json({
      message: "Availability created",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAvailibilityByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await buyerService.getAvailibilityByUser(userId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAvailibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId, status } = req.body;

    const result = await buyerService.updateAvailibility(
      userId,
      landId,
      status
    );

    return res.status(200).json({
      message: "Updated successfully",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteAvailibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.body;

    await buyerService.deleteAvailibility(userId, landId);

    return res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCart = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.createCart(userId, req.body);

    return res.status(201).json({
      message: "Added to cart",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCartByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.getCartByUser(userId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landIds } = req.body;

    await buyerService.deleteCart(userId, landIds);

    return res.status(200).json({
      message: "Removed from cart",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createPrimaryVisit = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.createPrimaryVisit(
      userId,
      req.body
    );

    return res.status(201).json({
      message: "Visit scheduled",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPrimaryVisitsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.getPrimaryVisitsByUser(userId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deletePrimaryVisit = async (req, res) => {
  try {
    const { id } = req.params;

    await buyerService.deletePrimaryVisit(id);

    return res.status(200).json({
      message: "Visit deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createShortlisting = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.createShortlisting(
      userId,
      req.body
    );

    return res.status(201).json({
      message: "Shortlisted successfully",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getShortlistingByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.getShortlistingByUser(userId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteShortlisting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.body;

    await buyerService.deleteShortlisting(userId, landId);

    return res.status(200).json({
      message: "Removed from shortlist",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const isShortlisted = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    const result = await buyerService.isShortlisted(userId, landId);

    return res.status(200).json({ isShortlisted: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createFinalList = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.createFinalList(userId, req.body);

    return res.status(201).json({
      message: "Added to final list",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFinalListByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.getFinalListByUser(userId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteFinalList = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.body;

    await buyerService.deleteFinalList(userId, landId);

    return res.status(200).json({
      message: "Removed from final list",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const isFinalListed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    const result = await buyerService.isFinalListed(userId, landId);

    return res.status(200).json({ isFinalListed: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.createPayment(userId, req.body);

    return res.status(201).json({
      message: "Payment created",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPaymentsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await buyerService.getPaymentsByUser(userId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPaymentByLand = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    const result = await buyerService.getPaymentByLand(userId, landId);

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landId } = req.params;

    const result = await buyerService.updatePayment(
      userId,
      landId,
      req.body
    );

    return res.status(200).json({
      message: "Payment updated",
      result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { landIds } = req.body;

    await buyerService.deletePayment(userId, landIds);

    return res.status(200).json({
      message: "Payment deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};