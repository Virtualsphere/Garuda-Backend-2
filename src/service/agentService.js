import { Agent, AgentVillage, LandObservation } from '../model/associationModel.js'
import { Op, fn, col } from "sequelize";
import sequelize from "../db/db.js";

export const createAgent = async (employeeId, data) => {
  const { mandal, district, state, village, name, phone, photo } = data;

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
    photo,
    refered_by: employeeId,
  });

  return agent;
};

export const getAllAgents = async (filters = {}) => {
  const { state, district, mandal, village, search } = filters;

  const whereClause = {};
  if (state) whereClause.state = state;
  if (district) whereClause.district = district;
  if (mandal) whereClause.mandal = mandal;
  if (village) whereClause.village = village;

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return await Agent.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]],
  });
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

/* =====================================================
   TACTICAL MAP
===================================================== */

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Resolve a node coordinate from the same fallback chain the fieldwork map
 * uses: land GPS centroid first, then the village's own seeded coordinate,
 * then the mandal's. Returns nulls when nothing can place the node.
 */
const resolveCoordinate = (row) => {
  const candidates = [
    ["land-centroid", toNumber(row.centroid_lat), toNumber(row.centroid_lng)],
    ["village", toNumber(row.village_lat), toNumber(row.village_lng)],
    ["mandal", toNumber(row.mandal_lat), toNumber(row.mandal_lng)],
  ];

  for (const [source, lat, lng] of candidates) {
    if (lat !== null && lng !== null) {
      return { latitude: lat, longitude: lng, coord_source: source };
    }
  }

  return { latitude: null, longitude: null, coord_source: null };
};

/**
 * Village nodes for the agent tactical map. Rooted in the administrative
 * village registry (not in land), so villages with no agent on them still
 * come back and can pulse as recruitment targets. Land aggregates and the
 * agents deployed on each node are joined on top.
 *
 * Villages that only exist in land or agent rows (name never seeded into the
 * village table) are still returned, via the full outer joins.
 */
export const getAgentMapNodes = async (filters = {}) => {
  const { state = null, district = null, mandal = null } = filters;

  const [rows] = await sequelize.query(
    `
    WITH land_agg AS (
      SELECT
        LOWER(l.village) AS village_key,
        LOWER(l.mandal)  AS mandal_key,
        MAX(l.village)   AS village_name,
        MAX(l.mandal)    AS mandal_name,
        MAX(l.district)  AS district_name,
        MAX(l.state)     AS state_name,
        COUNT(l.id)                          AS land_count,
        COUNT(l.agent_id)                    AS linked_land_count,
        COALESCE(SUM(ld.total_acres), 0)     AS total_acres,
        COALESCE(SUM(ld.total_value), 0)     AS total_value,
        AVG(NULLIF(l.location_latitude,  '')::double precision) AS centroid_lat,
        AVG(NULLIF(l.location_longitude, '')::double precision) AS centroid_lng
      FROM land l
      LEFT JOIN land_details ld ON ld.land_id = l.id
      WHERE l.trainee = false
      GROUP BY LOWER(l.village), LOWER(l.mandal)
    ),
    territory AS (
      -- an agent's home village counts as a posting, as does every explicitly
      -- assigned village node
      SELECT a.id AS agent_id, a.name, a.phone, a.photo,
             LOWER(a.village) AS village_key, LOWER(a.mandal) AS mandal_key,
             a.village AS village_name, a.mandal AS mandal_name,
             a.district AS district_name, a.state AS state_name,
             true AS is_home
      FROM agent a
      WHERE a.village IS NOT NULL AND a.village <> ''
      UNION
      SELECT av.agent_id, ag.name, ag.phone, ag.photo,
             LOWER(av.village), LOWER(av.mandal),
             av.village, av.mandal, av.district, av.state,
             false
      FROM agent_village av
      JOIN agent ag ON ag.id = av.agent_id
      WHERE av.village IS NOT NULL AND av.village <> ''
    ),
    agent_agg AS (
      SELECT
        village_key,
        mandal_key,
        MAX(village_name)  AS village_name,
        MAX(mandal_name)   AS mandal_name,
        MAX(district_name) AS district_name,
        MAX(state_name)    AS state_name,
        COUNT(DISTINCT agent_id) AS agent_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', agent_id,
            'name', name,
            'phone', phone,
            'photo', photo,
            'home', is_home
          ) ORDER BY name
        ) AS agents
      FROM territory
      GROUP BY village_key, mandal_key
    ),
    node_keys AS (
      SELECT
        LOWER(v.name) AS village_key,
        LOWER(m.name) AS mandal_key,
        v.name        AS village_name,
        m.name        AS mandal_name,
        d.name        AS district_name,
        s.name        AS state_name,
        v.latitude    AS village_lat,
        v.longitude   AS village_lng,
        m.latitude    AS mandal_lat,
        m.longitude   AS mandal_lng
      FROM village v
      JOIN mandal m ON m.id = v.mandal_id
      LEFT JOIN district d ON d.id = m.district_id
      LEFT JOIN state s    ON s.id = d.state_id
    )
    SELECT
      COALESCE(nk.village_name,  la.village_name,  aa.village_name)  AS village,
      COALESCE(nk.mandal_name,   la.mandal_name,   aa.mandal_name)   AS mandal,
      COALESCE(nk.district_name, la.district_name, aa.district_name) AS district,
      COALESCE(nk.state_name,    la.state_name,    aa.state_name)    AS state,
      nk.village_lat,
      nk.village_lng,
      nk.mandal_lat,
      nk.mandal_lng,
      la.centroid_lat,
      la.centroid_lng,
      COALESCE(la.land_count, 0)        AS land_count,
      COALESCE(la.linked_land_count, 0) AS linked_land_count,
      COALESCE(la.total_acres, 0)       AS total_acres,
      COALESCE(la.total_value, 0)       AS total_value,
      COALESCE(aa.agent_count, 0)       AS agent_count,
      COALESCE(aa.agents, '[]'::json)   AS agents
    FROM node_keys nk
    FULL OUTER JOIN land_agg la
      ON la.village_key = nk.village_key AND la.mandal_key = nk.mandal_key
    FULL OUTER JOIN agent_agg aa
      ON aa.village_key = COALESCE(nk.village_key, la.village_key)
     AND aa.mandal_key  = COALESCE(nk.mandal_key,  la.mandal_key)
    WHERE (:state    IS NULL OR COALESCE(nk.state_name,    la.state_name,    aa.state_name)    = :state)
      AND (:district IS NULL OR COALESCE(nk.district_name, la.district_name, aa.district_name) = :district)
      AND (:mandal   IS NULL OR COALESCE(nk.mandal_name,   la.mandal_name,   aa.mandal_name)   = :mandal)
      -- a node with no coordinate anywhere in the fallback chain cannot be
      -- drawn, so keep it out of the payload entirely
      AND (la.centroid_lat IS NOT NULL OR nk.village_lat IS NOT NULL OR nk.mandal_lat IS NOT NULL)
    ORDER BY 1
    `,
    { replacements: { state, district, mandal } }
  );

  return rows
    .map((row) => {
      const { latitude, longitude, coord_source } = resolveCoordinate(row);

      return {
        village: row.village,
        mandal: row.mandal,
        district: row.district,
        state: row.state,
        latitude,
        longitude,
        coord_source,
        land_count: Number(row.land_count) || 0,
        linked_land_count: Number(row.linked_land_count) || 0,
        total_acres: Number(row.total_acres) || 0,
        total_value: Number(row.total_value) || 0,
        agent_count: Number(row.agent_count) || 0,
        agents: Array.isArray(row.agents) ? row.agents : [],
      };
    })
    // a node with no coordinate cannot be drawn
    .filter((node) => node.latitude !== null && node.longitude !== null);
};

/**
 * Land nodes for the allotment map. When agentId is given, each node also
 * reports whether it is already linked to that agent, whether that agent is
 * merely observing it, and whether it falls inside their assigned territory
 * (the combination the map renders as a red "mission target" pulse).
 */
export const getAgentLandNodes = async (filters = {}) => {
  const {
    agentId = null,
    state = null,
    district = null,
    mandal = null,
    village = null,
  } = filters;

  const [rows] = await sequelize.query(
    `
    WITH territory AS (
      SELECT LOWER(a.village) AS village_key, LOWER(a.mandal) AS mandal_key
      FROM agent a
      WHERE a.id = :agentId AND a.village IS NOT NULL AND a.village <> ''
      UNION
      SELECT LOWER(av.village), LOWER(av.mandal)
      FROM agent_village av
      WHERE av.agent_id = :agentId AND av.village IS NOT NULL AND av.village <> ''
    )
    SELECT
      l.id,
      l.village,
      l.mandal,
      l.district,
      l.state,
      l.location_latitude,
      l.location_longitude,
      l.agent_id,
      ag.name  AS agent_name,
      ag.photo AS agent_photo,
      f.name   AS farmer_name,
      f.phone  AS farmer_phone,
      ld.total_acres,
      ld.total_value,
      COALESCE(ob.observation_count, 0) AS observation_count,
      COALESCE(ob.observers, '[]'::json) AS observers,
      CASE WHEN :agentId IS NULL THEN false
           ELSE EXISTS (
             SELECT 1 FROM territory t
             WHERE t.village_key = LOWER(l.village) AND t.mandal_key = LOWER(l.mandal)
           )
      END AS in_territory,
      CASE WHEN :agentId IS NULL THEN false
           ELSE l.agent_id = :agentId
      END AS linked_to_agent,
      CASE WHEN :agentId IS NULL THEN false
           ELSE EXISTS (
             SELECT 1 FROM land_observation lo2
             WHERE lo2.land_id = l.id AND lo2.agent_id = :agentId
           )
      END AS observed_by_agent
    FROM land l
    LEFT JOIN land_details ld  ON ld.land_id = l.id
    LEFT JOIN farmer_details f ON f.land_id = l.id
    LEFT JOIN agent ag         ON ag.id = l.agent_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS observation_count,
        JSON_AGG(JSON_BUILD_OBJECT('id', a2.id, 'name', a2.name, 'photo', a2.photo)) AS observers
      FROM land_observation lo
      JOIN agent a2 ON a2.id = lo.agent_id
      WHERE lo.land_id = l.id
    ) ob ON true
    WHERE l.trainee = false
      AND (:state    IS NULL OR l.state    = :state)
      AND (:district IS NULL OR l.district = :district)
      AND (:mandal   IS NULL OR l.mandal   = :mandal)
      AND (:village  IS NULL OR l.village  = :village)
    ORDER BY l.id
    `,
    {
      replacements: {
        agentId: agentId ? Number(agentId) : null,
        state,
        district,
        mandal,
        village,
      },
    }
  );

  return rows
    .map((row) => ({
      id: row.id,
      village: row.village,
      mandal: row.mandal,
      district: row.district,
      state: row.state,
      latitude: toNumber(row.location_latitude),
      longitude: toNumber(row.location_longitude),
      agent_id: row.agent_id,
      agent_name: row.agent_name,
      agent_photo: row.agent_photo,
      farmer_name: row.farmer_name,
      farmer_phone: row.farmer_phone,
      total_acres: toNumber(row.total_acres) || 0,
      total_value: toNumber(row.total_value) || 0,
      observation_count: Number(row.observation_count) || 0,
      observers: Array.isArray(row.observers) ? row.observers : [],
      in_territory: !!row.in_territory,
      linked_to_agent: !!row.linked_to_agent,
      observed_by_agent: !!row.observed_by_agent,
    }))
    .filter((node) => node.latitude !== null && node.longitude !== null);
};

/* =====================================================
   TERRITORY DEPLOYMENT
===================================================== */

export const getAgentTerritory = async (agentId) => {
  const agent = await Agent.findByPk(agentId);

  if (!agent) throw new Error("Agent not found");

  return await AgentVillage.findAll({
    where: { agent_id: agentId },
    order: [["village", "ASC"]],
  });
};

/**
 * Replace an agent's assigned village nodes with the given list.
 * Each entry is { state, district, mandal, village }.
 */
export const setAgentTerritory = async (agentId, villages = []) => {
  const agent = await Agent.findByPk(agentId);

  if (!agent) throw new Error("Agent not found");

  if (!Array.isArray(villages)) {
    throw new Error("villages must be an array");
  }

  const rows = villages
    .filter((entry) => entry && entry.village)
    .map((entry) => ({
      agent_id: Number(agentId),
      state: entry.state || null,
      district: entry.district || null,
      mandal: entry.mandal || null,
      village: entry.village,
    }));

  await sequelize.transaction(async (transaction) => {
    await AgentVillage.destroy({ where: { agent_id: agentId }, transaction });
    if (rows.length) {
      await AgentVillage.bulkCreate(rows, { transaction });
    }
  });

  return await AgentVillage.findAll({
    where: { agent_id: agentId },
    order: [["village", "ASC"]],
  });
};

/* =====================================================
   OBSERVATION ATTACHMENT
===================================================== */

export const addObservation = async (landId, agentId) => {
  if (!landId || !agentId) throw new Error("landId and agentId are required");

  const agent = await Agent.findByPk(agentId);
  if (!agent) throw new Error("Agent not found");

  const [observation] = await LandObservation.findOrCreate({
    where: { land_id: Number(landId), agent_id: Number(agentId) },
  });

  return observation;
};

export const removeObservation = async (landId, agentId) => {
  if (!landId || !agentId) throw new Error("landId and agentId are required");

  const removed = await LandObservation.destroy({
    where: { land_id: Number(landId), agent_id: Number(agentId) },
  });

  if (!removed) throw new Error("Observation not found");

  return true;
};