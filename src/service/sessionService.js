import { Employee, Session, SessionExpense } from "../model/associationModel.js";

export const startSession = async (employeeId, data) => {
  const activeSession = await Session.findOne({
    where: {
      employee_id: employeeId,
      status: "ACTIVE",
    },
  });

  if (activeSession) {
    throw new Error("Session already active");
  }

  const session = await Session.create({
    employee_id: employeeId,
    session_start_time: new Date(),
  });

  return session;
};

export const addSessionExpense = async (sessionId, expenses) => {
  const payload = expenses.map((exp) => ({
    session_id: sessionId,
    type: exp.type,
    amount: exp.amount,
    description: exp.description || null,
    photo: exp.photo || null,
  }));

  return await SessionExpense.bulkCreate(payload);
};

const PETROL_RATE = 2.5;

export const endSession = async (employeeId, data) => {
  const session = await Session.findOne({
    where: {
      employee_id: employeeId,
      status: "ACTIVE",
    },
  });

  if (!session) {
    throw new Error("No active session found");
  }

  const startKm = data.start_km;
  const endKm = data.end_km;

  if (startKm == null || endKm == null) {
    throw new Error("Start KM and End KM are required");
  }

  const distance = endKm - startKm;

  if (distance < 0) {
    throw new Error("End KM cannot be less than Start KM");
  }

  const petrolCharges = distance * PETROL_RATE;

  await session.update({
    start_km: startKm,
    start_photo: data.start_photo,
    end_km: endKm,
    end_photo: data.end_photo,
    petrol_charges: petrolCharges,
    session_end_time: new Date(),
    status: "COMPLETED",
  });

  return session;
};

export const getSessions = async (employeeId) => {
  return await Session.findAll({
    where: { employee_id: employeeId },
    include: [
      {
        model: SessionExpense,
        as: "sessionExpense",
      },
    ],
    order: [["created_at", "DESC"]],
  });
};
