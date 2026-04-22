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

import { createRazorpayOrder, verifyRazorpaySignature } from '../service/razorpayService.js'

export const createPayment = async (userId, data) => {
  let { land_id, amount, payment_status } = data;

  if (!land_id || !amount) {
    throw new Error("land_id and amount are required");
  }

  if (!Array.isArray(land_id)) {
    land_id = [land_id];
  }

  land_id = [...new Set(land_id)];

//   const razorpayOrder = await createRazorpayOrder(
//     amount,
//     `user_${userId}_${Date.now()}`
//   );

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
    payment_status: "pending",
    // razorpay_order_id: razorpayOrder.id
  }));

  const result = await Payment.bulkCreate(payload);

  return {
    result: result,
    order: razorpayOrder
  };
};

// export const confirmPayment = async (data) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature
//   } = data;

//   const isValid = verifyRazorpaySignature(
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature
//   );

//   if (!isValid) {
//     throw new Error("Payment verification failed");
//   }

//   await Payment.update(
//     {
//       payment_status: "success",
//       razorpay_payment_id,
//       razorpay_signature
//     },
//     {
//       where: { razorpay_order_id }
//     }
//   );

//   return true;
// };

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