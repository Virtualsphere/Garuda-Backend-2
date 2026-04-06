import Buyer from "../model/buyerModel.js";
import RefreshToken from "../model/refreshTokenModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  Land,
  FarmerDetails,
  LandDetails,
  LandGPS,
  LandMedia,
  LandDocuments,
  Employee,
} from "../model/associationModel.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "60m";
const REFRESH_TOKEN_EXPIRY_DAYS = 60;

/* =========================
   GENERATE TOKENS
========================= */

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

/* =========================
   SIGNUP
========================= */

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

/* =========================
   LOGIN
========================= */

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

/* =========================
   REFRESH TOKEN
========================= */

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

/* =========================
   UPDATE BUYER
========================= */

export const updateBuyer = async (id, data) => {
  const buyer = await Buyer.findByPk(id);
  if (!buyer) throw new Error("Buyer not found");

  await buyer.update(data);
  return buyer;
};

/* =========================
   DELETE BUYER
========================= */

export const deleteBuyer = async (id) => {
  const buyer = await Buyer.findByPk(id);
  if (!buyer) throw new Error("Buyer not found");

  await buyer.destroy();
  return true;
};

/* =========================
   LOGOUT (DELETE TOKEN)
========================= */

export const logout = async (refreshToken) => {
  await RefreshToken.destroy({
    where: { token: refreshToken },
  });

  return true;
};

