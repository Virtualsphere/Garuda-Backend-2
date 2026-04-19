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

  await session.update({
    start_km: data.start_km,
    start_photo: data.start_photo,
    end_km: data.end_km,
    end_photo: data.end_photo,
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
