import { Op, fn, col } from "sequelize";
import { Agent, Employee } from "../model/associationModel.js";

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * The coordination wing is sized around one executive looking after 500
 * agents. That number only means something if the assignment is recorded, so
 * these read and write `agent.coordination_executive_id`.
 */

/** Agents per coordination executive, plus how many nobody is looking after. */
export const getCoordinationLoad = async () => {
  const rows = await Agent.findAll({
    attributes: [
      "coordination_executive_id",
      [fn("COUNT", col("id")), "agent_count"],
    ],
    where: { status: "ACTIVE" },
    group: ["coordination_executive_id"],
    raw: true,
  });

  const counts = {};
  let unassigned = 0;

  rows.forEach((row) => {
    const count = Number(row.agent_count) || 0;
    if (row.coordination_executive_id === null) unassigned = count;
    else counts[String(row.coordination_executive_id)] = count;
  });

  const assigned = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return { counts, unassigned, assigned, total: assigned + unassigned };
};

/**
 * Move agents onto a coordination executive — or off one entirely when
 * `executiveId` is null, which returns them to the unassigned pool rather than
 * deleting anything.
 *
 * Refuses to push an executive past the 500-agent quota unless told to. The
 * cap is the whole point of the wing's shape; silently exceeding it would make
 * every capacity figure in the hierarchy view wrong.
 */
export const assignCoordinationExecutive = async (payload = {}) => {
  const agentIds = Array.isArray(payload.agentIds) ? payload.agentIds : [];
  if (!agentIds.length) throw httpError("At least one agent is required");

  const executiveId = payload.executiveId ?? null;

  if (executiveId !== null) {
    const employee = await Employee.findByPk(executiveId);
    if (!employee) throw httpError("Coordination executive not found", 404);

    if (!payload.allowOverQuota) {
      const existing = await Agent.count({
        where: {
          coordination_executive_id: executiveId,
          status: "ACTIVE",
          id: { [Op.notIn]: agentIds },
        },
      });

      const QUOTA = 500;
      if (existing + agentIds.length > QUOTA) {
        throw httpError(
          `${employee.name} would be looking after ${existing + agentIds.length} agents, over the ${QUOTA} quota. Pass allowOverQuota to do it anyway.`,
          409
        );
      }
    }
  }

  const [updated] = await Agent.update(
    { coordination_executive_id: executiveId },
    { where: { id: { [Op.in]: agentIds } } }
  );

  return { updated, executiveId };
};
