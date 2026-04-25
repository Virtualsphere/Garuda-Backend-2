import { Employee, WorkWallet, PetrolAdvance, Session, SessionExpense } from '../model/associationModel.js'
import { Op } from "sequelize"

export const updateWorkWallet = async (id) => {
  const wallet = await WorkWallet.findByPk(id);

  if (!wallet) {
    throw new Error("Work wallet record not found");
  }

  if (wallet.status === "COMPLETED") {
    throw new Error("Already completed");
  }

  await wallet.update({
    status: "COMPLETED",
  });

  return wallet;
};

export const getWorkWalletByEmployee = async (employeeId, startDate, endDate) => {
  const wallets = await WorkWallet.findAll({
    where: {
      employee_id: employeeId,
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    },
    order: [["created_at", "DESC"]],
  });

  const result = {
    total: 0,
    given: 0,
    due: 0,

    breakdown: {
      BASIC_SALARY: 0,
      NEW_LAND: 0,
      VERIFIED: 0,
      BUYER_VISIT: 0,
      FILL_DETAILS: 0,
      REFERAL: 0,
    },

    data: [],
  };

  wallets.forEach((item) => {
    const amount = item.amount || 0;

    result.total += amount;

    if (item.status === "COMPLETED") {
      result.given += amount;
    } else {
      result.due += amount;
    }

    const key = item.amount_type.replace(/\s/g, "_");

    if (result.breakdown[key] !== undefined) {
      result.breakdown[key] += amount;
    }
  });

  return result;
};

export const getTravelWalletByEmployee = async (employeeId) => {

  const advances = await PetrolAdvance.findAll({
    where: { employee_id: employeeId },
    order: [["created_at", "DESC"]],
  });

  const sessions = await Session.findAll({
    where: { employee_id: employeeId, status: "COMPLETED" },
    include: [
      {
        model: SessionExpense,
        as: "sessionExpense",
      },
    ],
    order: [["created_at", "DESC"]],
  });

  let totalAdvance = 0;
  let totalPetrolCharges = 0;

  const petrolAdvance = [];
  const petrolCharges = [];
  const busTickets = [];
  const otherExpenses = [];

  advances.forEach((item) => {
    totalAdvance += item.amount;

    petrolAdvance.push({
      amount: item.amount,
      date: item.created_at,
    });
  });

  sessions.forEach((session) => {

    if (session.petrol_charges) {
      totalPetrolCharges += session.petrol_charges;

      petrolCharges.push({
        amount: session.petrol_charges,
        date: session.session_end_time,
      });
    }

    session.sessionExpense.forEach((exp) => {
      if (exp.type === "BUS") {
        busTickets.push({
          amount: exp.amount,
          date: exp.created_at,
        });
      } else {
        otherExpenses.push({
          amount: exp.amount,
          date: exp.created_at,
          description: exp.description,
        });
      }
    });
  });

  return {
    petrolBalance: totalAdvance - totalPetrolCharges,

    summary: {
      totalAdvance,
      totalPetrolCharges,
    },

    petrolAdvance,
    petrolCharges,
    busTickets,
    otherExpenses,
  };
};

export const addPetrolAdvance = async (employeeId, amount) => {

  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const entry = await PetrolAdvance.create({
    employee_id: employeeId,
    amount,
  });

  return entry;
};