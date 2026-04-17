import { Agent } from '../model/associationModel.js'
import { Op, fn, col } from "sequelize";

export const createAgent = async (employeeId, data) => {
  const { mandal, district, state, village, name, phone } = data;

  if (!mandal) throw new Error("Mandal is required");

  const count = await Agent.count({
    where: { mandal },
  });

  if (count >= 4) {
    throw new Error("Cannot add more agents. Mandal is FULL");
  }

  const agent = await Agent.create({
    state,
    district,
    mandal,
    village,
    name,
    phone,
    refered_by: employeeId,
  });

  return agent;
};

export const getAgentsByLocation = async (filters = {}) => {
  const { state, district } = filters;

  const whereClause = {};

  if (state) whereClause.state = state;
  if (district) whereClause.district = district;

  const mandalCounts = await Agent.findAll({
    attributes: [
      "state",
      "district",
      "mandal",
      [fn("COUNT", col("id")), "agent_count"],
    ],
    where: whereClause,
    group: ["state", "district", "mandal"],
    raw: true,
  });

  return mandalCounts.map((item) => {
    const count = parseInt(item.agent_count);

    let status = "NEEDS_AGENT";
    if (count === 0) status = "EMPTY";
    else if (count >= 4) status = "FULL";

    return {
      state: item.state,
      district: item.district,
      mandal: item.mandal,
      total_agents: count,
      status,
    };
  });
};

export const updateAgent = async (id, data) => {
  const agent = await Agent.findByPk(id);

  if (!agent) throw new Error("Agent not found");

  await agent.update(data);

  return agent;
};

export const deleteAgent = async (id) => {
  const agent = await Agent.findByPk(id);

  if (!agent) throw new Error("Agent not found");

  await agent.destroy();

  return true;
};