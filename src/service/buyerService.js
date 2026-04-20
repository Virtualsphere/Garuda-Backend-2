import Buyer from "../model/buyerModel.js";
import RefreshToken from "../model/refreshTokenModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import {
  Land,
  WishList,
  FinalList,
  Shortlisting,
  PrimaryVisit,
  Employee,
  Payment,
  Cart,
  Availibility,
  LandFeedBack,
  LandMedia,
  LandDetails
} from "../model/associationModel.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "60m";
const REFRESH_TOKEN_EXPIRY_DAYS = 60;


const generateAccessToken = (buyer) => {
  return jwt.sign(
    { id: buyer.id, type: "buyer" },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = async (buyer) => {
  const token = jwt.sign(
    { id: buyer.id, type: "buyer" },
    REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );

  await RefreshToken.create({
    user_id: buyer.id,
    role: 'buyer',
    token,
    expiry_date: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ),
  });

  return token;
};


export const signup = async (data) => {
  const { name, email, phone, password, photo } = data;

  const existing = await Buyer.findOne({ where: { email } });
  if (existing) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const buyer = await Buyer.create({
    name,
    email,
    phone,
    password: hashedPassword,
    photo
  });

  return buyer;
};


export const login = async ({ email, password }) => {
  const buyer = await Buyer.findOne({ where: { email } });

  if (!buyer) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, buyer.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(buyer);
  const refreshToken = await generateRefreshToken(buyer);

  return {
    buyer,
    accessToken,
    refreshToken,
  };
};

export const getUserById= async (id)=>{
  return await Buyer.findByPk(id);
}

export const refreshAccessToken = async (token) => {
  const storedToken = await RefreshToken.findOne({
    where: { token },
  });

  if (!storedToken) throw new Error("Invalid refresh token");

  if (new Date() > storedToken.expiry_date) {
    throw new Error("Refresh token expired");
  }

  const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

  const buyer = await Buyer.findByPk(decoded.id);
  if (!buyer) throw new Error("User not found");

  const newAccessToken = generateAccessToken(buyer);

  return { accessToken: newAccessToken };
};

export const updateBuyer = async (id, data) => {
  const buyer = await Buyer.findByPk(id);
  if (!buyer) throw new Error("Buyer not found");

  await buyer.update(data);
  return buyer;
};

export const deleteBuyer = async (id) => {
  const buyer = await Buyer.findByPk(id);
  if (!buyer) throw new Error("Buyer not found");

  await buyer.destroy();
  return true;
};

export const logout = async (refreshToken) => {
  await RefreshToken.destroy({
    where: { token: refreshToken },
  });

  return true;
};

export const createWishList = async (userId, data) => {
  let { land_id } = data;

  if (!Array.isArray(land_id)) {
    land_id = [land_id];
  }

  land_id = [...new Set(land_id)];

  const existing = await WishList.findAll({
    where: {
      user_id: userId,
      land_id,
    },
  });

  const existingLandIds = existing.map((item) => item.land_id);

  const newLandIds = land_id.filter(
    (id) => !existingLandIds.includes(id)
  );

  const payload = newLandIds.map((id) => ({
    user_id: userId,
    land_id: id,
  }));

  const result = await WishList.bulkCreate(payload);

  return result;
};

export const getWishListByUser = async (userId) => {
  return await WishList.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Land,
        as: "wishListLands",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const deleteWishList = async (userId, landIds) => {
  if (!Array.isArray(landIds)) {
    landIds = [landIds];
  }

  await WishList.destroy({
    where: {
      user_id: userId,
      land_id: landIds,
    },
  });

  return true;
};

export const deleteWishListById = async (id) => {
  await WishList.destroy({
    where: {
      id: id,
    },
  });

  return true;
};

export const isWishListed = async (userId, landId) => {
  const exists = await WishList.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  return !!exists;
};

export const createAvailibility = async (userId, data) => {
  let { land_id } = data;

  if (!land_id) {
    throw new Error("land_id is required");
  }

  if (!Array.isArray(land_id)) {
    land_id = [land_id];
  }

  land_id = [...new Set(land_id)];

  const existing = await Availibility.findAll({
    where: {
      user_id: userId,
      land_id,
    },
  });

  const existingLandIds = existing.map((item) => item.land_id);

  const newLandIds = land_id.filter(
    (id) => !existingLandIds.includes(id)
  );

  const payload = newLandIds.map((id) => ({
    user_id: userId,
    land_id: id,
    status: "available",
  }));

  const result = await Availibility.bulkCreate(payload);

  return result;
};

export const getAvailibilityByUser = async (userId) => {
  return await Availibility.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Land,
        as: "availibilityLand",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getAvailibilityByLand = async (userId, landId) => {
  const result = await Availibility.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!result) {
    throw new Error("Not found");
  }

  return result;
};

export const updateAvailibility = async (userId, landId, status) => {
  const record = await Availibility.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!record) {
    throw new Error("Availibility not found");
  }

  await record.update({ status });

  return record;
};

export const deleteAvailibility = async (userId, landId) => {
  const record = await Availibility.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!record) {
    throw new Error("Availibility not found");
  }

  await record.destroy();

  return true;
};

export const createCart = async (userId, data) => {
  let { land_id } = data;

  if (!Array.isArray(land_id)) {
    land_id = [land_id];
  }

  land_id = [...new Set(land_id)];

  const existing = await Cart.findAll({
    where: {
      user_id: userId,
      land_id,
    },
  });

  const existingLandIds = existing.map((item) => item.land_id);

  const newLandIds = land_id.filter(
    (id) => !existingLandIds.includes(id)
  );

  const payload = newLandIds.map((id) => ({
    user_id: userId,
    land_id: id,
  }));

  const result = await Cart.bulkCreate(payload);

  return result;
};

export const getCartByUser = async (userId) => {
  return await Cart.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Land,
        as: "cartLand",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const deleteCart = async (userId, landIds) => {
  if (!Array.isArray(landIds)) {
    landIds = [landIds];
  }

  await Cart.destroy({
    where: {
      user_id: userId,
      land_id: landIds,
    },
  });

  return true;
};

export const createPrimaryVisit = async (userId, data) => {
  let { land_id, visit_date, time, meeting_status } = data;

  if (!land_id) {
    throw new Error("land_id is required");
  }

  if (!Array.isArray(land_id)) {
    land_id = [land_id];
  }

  land_id = [...new Set(land_id)];

  const existing = await PrimaryVisit.findAll({
    where: {
      user_id: userId,
      land_id,
    },
  });

  const existingLandIds = existing.map((item) => item.land_id);

  const newLandIds = land_id.filter(
    (id) => !existingLandIds.includes(id)
  );

  const payload = newLandIds.map((id) => ({
    user_id: userId,
    land_id: id,
    visit_date,
    time,
    meeting_status,
  }));

  const result = await PrimaryVisit.bulkCreate(payload);

  return result;
};

export const getPrimaryVisitsByUser = async (userId) => {
  return await PrimaryVisit.findAll({
    where: {
      user_id: userId,
      meeting_status: {
        [Op.in]: ["Scheduled", "Postponed"],
      },
    },
    include: [
      {
        model: Land,
        as: "primaryVisitLand",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
      {
        model: Employee,
        as: "primaryVisitEmployee",
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getPrimaryVisitsByEmployee = async (employeeId) => {
  return await PrimaryVisit.findAll({
    where: {
      employee_id: employeeId,
      meeting_status: {
        [Op.in]: ["Scheduled", "Postponed"],
      },
    },
    include: [
      {
        model: Land,
        as: "primaryVisitLand",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
      {
        model: Employee,
        as: "primaryVisitEmployee",
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getLandFeebBack = async (employeeId) => {
  return await PrimaryVisit.findAll({
    where: {
      employee_id: employeeId,
      meeting_status: {
        [Op.in]: ["Scheduled", "Postponed"],
      },
    },
    attributes: ["land_id"],
    order: [["created_at", "DESC"]],
  });
};

export const getPrimaryVisitById = async (id) => {
  const visit = await PrimaryVisit.findByPk(id, {
    include: [
      { model: Land, as: "primaryVisitLand" },
      { model: Employee, as: "primaryVisitEmployee" },
    ],
  });

  if (!visit) throw new Error("Primary visit not found");

  return visit;
};

export const deletePrimaryVisit = async (visitId) => {
  const visit = await PrimaryVisit.findByPk(visitId);

  if (!visit) {
    throw new Error("Primary visit not found");
  }

  await visit.destroy();

  return true;
};

export const updatePrimaryVisitByEmployee = async (
  landId,
  employeeId,
  data
) => {
  const {
    user_id,
    meeting_status,
    land_visit_photos,
    fee_receipt,
    buyer_visit,
    visit_date,
    time,
  } = data;

  const visit = await PrimaryVisit.findOne({
    where: {
      user_id,
      land_id: landId,
      employee_id: employeeId,
    },
  });

  if (!visit) {
    throw new Error("Primary visit not found or not assigned to you");
  }

  const updateData = {};

  if (meeting_status) updateData.meeting_status = meeting_status;
  if (visit_date) updateData.visit_date = visit_date;
  if (time) updateData.time = time;

  if (land_visit_photos) updateData.land_visit_photos = land_visit_photos;

  if (fee_receipt) {
    // expected structure
    // { amount: 1000, receipt_url: "..." }
    updateData.fee_receipt = fee_receipt;
  }

  if (buyer_visit) {
    // expected structure
    // { sheet_url: "..." }
    updateData.buyer_visit = buyer_visit;
  }

  await visit.update(updateData);

  return visit;
};

export const updatePrimaryVisitByAdmin = async (
  userId,
  landId,
  employeeId
) => {
  const visit = await PrimaryVisit.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!visit) {
    throw new Error("Primary visit not found");
  }

  await visit.update({
    employee_id: employeeId,
  });

  return visit;
};

export const createLandFeedback = async (employeeId, data) => {
  const { user_id, buyer_agreement, lands } = data;

  if (!user_id) throw new Error("user_id is required");
  if (!lands || !Array.isArray(lands)) {
    throw new Error("lands must be an array");
  }

  for (const item of lands) {
    if (!item.land_id) {
      throw new Error("Each land must have land_id");
    }
  }

  const feedback = await LandFeedBack.create({
    employee_id: employeeId,
    user_id,
    buyer_aggrement: buyer_agreement,
    land_feedback: lands,
  });

  return feedback;
};

export const createShortlisting = async (userId, data) => {
  const { land_id } = data;

  if (!land_id) {
    throw new Error("land_id is required");
  }

  const existing = await Shortlisting.findOne({
    where: {
      user_id: userId,
      land_id,
    },
  });

  if (existing) {
    throw new Error("Already shortlisted");
  }

  return await Shortlisting.create({
    user_id: userId,
    land_id,
  });
};

export const getShortlistingByUser = async (userId) => {
  return await Shortlisting.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Land,
        as: "shortlistLand",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const deleteShortlisting = async (userId, landId) => {
  const record = await Shortlisting.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!record) {
    throw new Error("Shortlisting not found");
  }

  await record.destroy();

  return true;
};

export const isShortlisted = async (userId, landId) => {
  const exists = await Shortlisting.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  return !!exists;
};

export const createFinalList = async (userId, data) => {
  const { land_id } = data;

  if (!land_id) {
    throw new Error("land_id is required");
  }

  const existing = await FinalList.findOne({
    where: {
      user_id: userId,
      land_id,
    },
  });

  if (existing) {
    throw new Error("Already in final list");
  }

  return await FinalList.create({
    user_id: userId,
    land_id,
  });
};

export const getFinalListByUser = async (userId) => {
  return await FinalList.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Land,
        as: "finalizeLand",
        include: [
          { model: LandMedia, as: "media" },
          { model: LandDetails, as: "landDetails" },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const deleteFinalList = async (userId, landId) => {
  const record = await FinalList.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!record) {
    throw new Error("Final list item not found");
  }

  await record.destroy();

  return true;
};

export const isFinalListed = async (userId, landId) => {
  const exists = await FinalList.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  return !!exists;
};

export const createPayment = async (userId, data) => {
  let { land_id, amount, payment_status } = data;

  if (!land_id || !amount) {
    throw new Error("land_id and amount are required");
  }

  if (!Array.isArray(land_id)) {
    land_id = [land_id];
  }

  land_id = [...new Set(land_id)];

  const existing = await Payment.findAll({
    where: {
      user_id: userId,
      land_id,
    },
  });

  const existingLandIds = existing.map((item) => item.land_id);

  const newLandIds = land_id.filter(
    (id) => !existingLandIds.includes(id)
  );

  const payload = newLandIds.map((id) => ({
    user_id: userId,
    land_id: id,
    amount,
    payment_status: payment_status || "pending",
  }));

  const result = await Payment.bulkCreate(payload);

  return result;
};

export const getPaymentsByUser = async (userId) => {
  return await Payment.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Land,
        as: "paymentLands",
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getPaymentByLand = async (userId, landId) => {
  const payment = await Payment.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
    include: [
      {
        model: Land,
        as: "paymentLands",
      },
    ],
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

export const updatePayment = async (userId, landId, data) => {
  const payment = await Payment.findOne({
    where: {
      user_id: userId,
      land_id: landId,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const { user_id, land_id: lid, id, ...allowedData } = data;

  await payment.update(allowedData);

  return payment;
};

export const deletePayment = async (userId, landIds) => {
  if (!Array.isArray(landIds)) {
    landIds = [landIds];
  }

  await Payment.destroy({
    where: {
      user_id: userId,
      land_id: landIds,
    },
  });

  return true;
};
