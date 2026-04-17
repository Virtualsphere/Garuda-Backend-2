import { Employee, WorkWallet, TravelWallet } from '../model/associationModel.js'
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
  const wallets = await TravelWallet.findAll({
    where: { employee_id: employeeId },
    order: [["created_at", "DESC"]],
  });

  const result = {
    petrolAdvance: [],
    petrolCharges: [],
    busTickets: [],
    otherExpenses: [],
  };

  wallets.forEach((item) => {
    const formattedData = {
      amount: item.amount,
      date: item.created_at,
    };

    switch (item.amount_type) {
      case "PETROL ADVANCE":
        result.petrolAdvance.push(formattedData);
        break;

      case "PETROL CHARGES":
        result.petrolCharges.push(formattedData);
        break;

      case "BUS TICKET":
        result.busTickets.push(formattedData);
        break;

      case "OTHER EXPENSES":
        result.otherExpenses.push({
          ...formattedData,
          description: item.description, // only here
        });
        break;

      default:
        break;
    }
  });

  return result;
};