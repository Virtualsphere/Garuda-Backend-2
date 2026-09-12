/**
 * Sample data for exercising the Agents section end to end.
 *
 * Creates village coordinates, land records with acreage, agents with
 * territories, a candidate pipeline spread across every stage, village seats,
 * call signals and land observations — enough to make the dashboard, tactical
 * map, recruitment pipeline and calls log all show real numbers.
 *
 * DEV ONLY. It writes to whatever PGHOST points at, so it prints the target
 * and refuses to run without --yes:
 *
 *   node src/scripts/seedAgentSampleData.js          # dry run
 *   node src/scripts/seedAgentSampleData.js --yes    # write
 *
 * Idempotent by natural key (village name, agent phone, candidate phone), so
 * re-running tops up rather than duplicating.
 */
import dotenv from "dotenv";
import sequelize from "../db/db.js";
import {
  Agent,
  AgentVillage,
  AgentCandidate,
  CandidateStatusHistory,
  CandidateVillageInterest,
  VillagePosition,
  Land,
  LandDetails,
  LandObservation,
  Village,
  Mandal,
  Employee,
} from "../model/associationModel.js";
import CallSignal from "../model/callSignalModel.js";

dotenv.config();

const APPLY = process.argv.includes("--yes");

/* ── Geography ──────────────────────────────────────────────────── */

const D = "Nagarkurnool";
const W = "Wanaparthy";
const M = "Mahabubnagar";
const S = "Telangana";

// Approximate real coordinates so the tactical map spreads out sensibly.
const VILLAGES = [
  { name: "Panjugula",     mandal: "Kollapur",      district: D, lat: 16.12, lng: 78.33 },
  { name: "Amarapuram",    mandal: "Kollapur",      district: D, lat: 16.18, lng: 78.29 },
  { name: "Singotam",      mandal: "Kollapur",      district: D, lat: 16.16, lng: 78.41 },
  { name: "Jataprolu",     mandal: "Kollapur",      district: D, lat: 16.20, lng: 78.35 },
  { name: "Chinnambavi",   mandal: "Kollapur",      district: D, lat: 16.08, lng: 78.38 },
  { name: "Pentlavelli",   mandal: "Pentlavelli",   district: D, lat: 16.31, lng: 78.44 },
  { name: "Rangapur",      mandal: "Pentlavelli",   district: D, lat: 16.35, lng: 78.40 },
  { name: "Uyyalawada",    mandal: "Pentlavelli",   district: D, lat: 16.28, lng: 78.49 },
  { name: "Achampet",      mandal: "Achampet",      district: D, lat: 16.39, lng: 78.66 },
  { name: "Mannanur",      mandal: "Achampet",      district: D, lat: 16.45, lng: 78.65 },
  { name: "Appapur",       mandal: "Achampet",      district: D, lat: 16.25, lng: 78.72 },
  { name: "Kothapet",      mandal: "Pangal",        district: W, lat: 16.36, lng: 78.06 },
  { name: "Pangal",        mandal: "Pangal",        district: W, lat: 16.42, lng: 78.11 },
  { name: "Gopalpet",      mandal: "Pangal",        district: W, lat: 16.48, lng: 78.02 },
  { name: "Atmakur",       mandal: "Atmakur",       district: W, lat: 16.60, lng: 78.13 },
  { name: "Veepanagandla", mandal: "Atmakur",       district: W, lat: 16.52, lng: 78.21 },
  { name: "Jadcherla",     mandal: "Jadcherla",     district: M, lat: 16.76, lng: 78.15 },
  { name: "Polepally",     mandal: "Jadcherla",     district: M, lat: 16.72, lng: 78.19 },
  { name: "Badepally",     mandal: "Jadcherla",     district: M, lat: 16.78, lng: 78.12 },
];

const byVillage = (name) => VILLAGES.find((v) => v.name === name);

/* ── Lands ──────────────────────────────────────────────────────── */
// Acreage is chosen to straddle the default slab boundaries (500 / 1000 /
// 2000), so different villages land in different agent-requirement bands.
const LANDS = [
  { village: "Panjugula",     acres: 120, price: 900000 },
  { village: "Panjugula",     acres: 95,  price: 850000 },
  { village: "Panjugula",     acres: 210, price: 1100000 },
  { village: "Amarapuram",    acres: 340, price: 780000 },
  { village: "Amarapuram",    acres: 260, price: 810000 },
  { village: "Singotam",      acres: 480, price: 640000 },
  { village: "Singotam",      acres: 320, price: 700000 },
  { village: "Singotam",      acres: 290, price: 660000 },
  { village: "Jataprolu",     acres: 150, price: 720000 },
  { village: "Chinnambavi",   acres: 88,  price: 540000 },
  { village: "Pentlavelli",   acres: 610, price: 950000 },
  { village: "Pentlavelli",   acres: 520, price: 980000 },
  { village: "Rangapur",      acres: 410, price: 700000 },
  { village: "Uyyalawada",    acres: 260, price: 620000 },
  { village: "Achampet",      acres: 1150, price: 1250000 },
  { village: "Achampet",      acres: 980,  price: 1180000 },
  { village: "Mannanur",      acres: 420, price: 590000 },
  { village: "Appapur",       acres: 180, price: 480000 },
  { village: "Kothapet",      acres: 730, price: 860000 },
  { village: "Pangal",        acres: 540, price: 820000 },
  { village: "Gopalpet",      acres: 310, price: 760000 },
  { village: "Atmakur",       acres: 890, price: 1020000 },
  { village: "Veepanagandla", acres: 250, price: 690000 },
  { village: "Jadcherla",     acres: 1320, price: 1450000 },
  { village: "Jadcherla",     acres: 1080, price: 1390000 },
  { village: "Polepally",     acres: 640, price: 1150000 },
  { village: "Badepally",     acres: 430, price: 1080000 },
];

/* ── Agents ─────────────────────────────────────────────────────── */
const AGENTS = [
  { name: "Mallesh Goud",    phone: "9848101001", village: "Singotam",      territory: ["Singotam", "Jataprolu"], membership: "PAID" },
  { name: "Narsimha Reddy",  phone: "9848101002", village: "Amarapuram",    territory: ["Amarapuram"],            membership: "PAID" },
  { name: "Venkatesh Naik",  phone: "9848101003", village: "Pentlavelli",   territory: ["Pentlavelli", "Rangapur"], membership: "PENDING" },
  { name: "Srinivas Rao",    phone: "9848101004", village: "Achampet",      territory: ["Achampet", "Mannanur"],  membership: "PAID" },
  { name: "Yadaiah Kurma",   phone: "9848101005", village: "Kothapet",      territory: ["Kothapet"],              membership: "PENDING" },
  { name: "Bhaskar Rathod",  phone: "9848101006", village: "Atmakur",       territory: ["Atmakur", "Veepanagandla"], membership: "PAID" },
  { name: "Ramulu Banoth",   phone: "9848101007", village: "Jadcherla",     territory: ["Jadcherla", "Polepally"], membership: "EXEMPT" },
  { name: "Krishna Murthy",  phone: "9848101008", village: "Pangal",        territory: ["Pangal", "Gopalpet"],    membership: "PAID" },
];

/* ── Candidates ─────────────────────────────────────────────────── */
// Spread across the pipeline so every stage chip has something behind it.
// `interested` villages drive native vs outside: native when it equals `village`.
const CANDIDATES = [
  { name: "Anjaiah Goud",     phone: "9848202001", village: "Panjugula",    status: "NEW_LEAD",        source: "META_ADS",          interested: ["Panjugula"] },
  { name: "Balaraju Nayak",   phone: "9848202002", village: "Panjugula",    status: "FIRST_CALL",      source: "INBOUND_CALL",      interested: ["Panjugula"] },
  { name: "Chandrakala Devi", phone: "9848202003", village: "Singotam",     status: "INTERESTED",      source: "AGENT_REFERRAL",    interested: ["Singotam", "Jataprolu"] },
  { name: "Dasharath Reddy",  phone: "9848202004", village: "Amarapuram",   status: "LOCATION_CHECK",  source: "DIRECT",            interested: ["Singotam"] },
  { name: "Eshwar Rao",       phone: "9848202005", village: "Jataprolu",    status: "VILLAGE_INTEREST",source: "META_ADS",          interested: ["Jataprolu"] },
  { name: "Ganesh Kumar",     phone: "9848202006", village: "Chinnambavi",  status: "WAITING",         source: "WALK_IN",           interested: ["Panjugula", "Chinnambavi"] },
  { name: "Hymavathi Bai",    phone: "9848202007", village: "Rangapur",     status: "OFFICE_VISIT",    source: "EMPLOYEE_REFERRAL", interested: ["Rangapur"] },
  { name: "Ilaiah Mudiraj",   phone: "9848202008", village: "Uyyalawada",   status: "JOINING_PROCESS", source: "DIRECT",            interested: ["Uyyalawada"] },
  { name: "Jangaiah Yadav",   phone: "9848202009", village: "Mannanur",     status: "NOT_INTERESTED",  source: "META_ADS",          interested: [] },
  { name: "Kavitha Rani",     phone: "9848202010", village: "Appapur",      status: "NOT_RESPONDING",  source: "INBOUND_CALL",      interested: [] },
  { name: "Lingaiah Dudekula",phone: "9848202011", village: "Gopalpet",     status: "INTERESTED",      source: "FIELD_VISIT",       interested: ["Gopalpet", "Pangal"] },
  { name: "Mahesh Chary",     phone: "9848202012", village: "Polepally",    status: "FIRST_CALL",      source: "META_ADS",          interested: ["Polepally"] },
  { name: "Nagamani Devi",    phone: "9848202013", village: "Badepally",    status: "INTERESTED",      source: "AGENT_REFERRAL",    interested: ["Badepally"] },
  { name: "Omkar Singh",      phone: "9848202014", village: "Veepanagandla",status: "REJECTED",        source: "DIRECT",            interested: [] },
];

/* ── Calls ──────────────────────────────────────────────────────── */
const CALL_CONTEXTS = [
  "Agent recruitment follow-up",
  "Village vacancy enquiry",
  "Joining formalities",
  "Membership payment reminder",
  "Land observation check-in",
  "Territory reassignment",
  "Document collection",
  "Training schedule",
];

/* ── Helpers ────────────────────────────────────────────────────── */

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const iso = (d) => d.toISOString().split("T")[0];

const log = (msg) => console.log(msg);

/* ── Seed ───────────────────────────────────────────────────────── */

const seed = async () => {
  log("─".repeat(66));
  log("Agent sample data");
  log(`  host:     ${process.env.PGHOST}`);
  log(`  database: ${process.env.PGDATABASE}`);
  log("─".repeat(66));

  if (!APPLY) {
    log("\nDry run — nothing written. Would create roughly:");
    log(`  ${VILLAGES.length} village coordinate updates`);
    log(`  ${LANDS.length} lands (with acreage + value)`);
    log(`  ${AGENTS.length} agents (with territories)`);
    log(`  ${CANDIDATES.length} candidates across the pipeline`);
    log(`  village seats for every village with acreage`);
    log(`  ~24 call signals, ~10 land observations`);
    log("\nRe-run with --yes to write.\n");
    await sequelize.close();
    return;
  }

  const created = {
    coords: 0, lands: 0, agents: 0, territory: 0,
    candidates: 0, interests: 0, seats: 0, calls: 0, observations: 0,
  };

  // 1. Village + mandal coordinates ────────────────────────────────
  for (const v of VILLAGES) {
    const [n] = await Village.update(
      { latitude: v.lat, longitude: v.lng },
      { where: { name: v.name } }
    );
    created.coords += n;
  }

  // Mandal centre = mean of its villages, so mandal-level fallback works too.
  const mandalNames = [...new Set(VILLAGES.map((v) => v.mandal))];
  for (const name of mandalNames) {
    const kids = VILLAGES.filter((v) => v.mandal === name);
    await Mandal.update(
      {
        latitude: kids.reduce((s, k) => s + k.lat, 0) / kids.length,
        longitude: kids.reduce((s, k) => s + k.lng, 0) / kids.length,
      },
      { where: { name } }
    );
  }

  // 2. Lands ───────────────────────────────────────────────────────
  const anyEmployee = await Employee.findOne({ order: [["id", "ASC"]] });

  for (const [i, l] of LANDS.entries()) {
    const v = byVillage(l.village);
    // Land has no natural key, so guard on the per-village count this seed
    // would create — re-running then tops up rather than duplicating.
    const already = await Land.count({ where: { village: l.village } });
    const wanted = LANDS.filter((x) => x.village === l.village).length;
    if (already >= wanted) continue;

    const land = await Land.create({
      state: S,
      district: v.district,
      mandal: v.mandal,
      village: l.village,
      trainee: false,
      location_latitude: String(v.lat + (Math.random() - 0.5) * 0.02),
      location_longitude: String(v.lng + (Math.random() - 0.5) * 0.02),
      created_by: anyEmployee?.id ?? null,
    });

    await LandDetails.create({
      land_id: land.id,
      total_acres: l.acres,
      price_per_acres: l.price,
      total_value: l.acres * l.price,
    });

    created.lands += 1;
  }

  // 3. Agents + territory ──────────────────────────────────────────
  for (const a of AGENTS) {
    const v = byVillage(a.village);
    let agent = await Agent.findOne({ where: { phone: a.phone } });

    if (!agent) {
      agent = await Agent.create({
        name: a.name,
        phone: a.phone,
        state: S,
        district: v.district,
        mandal: v.mandal,
        village: a.village,
        refered_by: anyEmployee?.id ?? null,
        joining_date: iso(daysAgo(30 + Math.floor(Math.random() * 300))),
        status: "ACTIVE",
        membership_status: a.membership,
        membership_amount: a.membership === "PAID" ? 2500 : 0,
        commission_earned: Math.round(Math.random() * 60000),
        commission_paid: Math.round(Math.random() * 20000),
        lead_source: "FIELD_VISIT",
        rating: (3.5 + Math.random() * 1.5).toFixed(2),
      });
      created.agents += 1;
    }

    for (const tv of a.territory) {
      const t = byVillage(tv);
      const [, made] = await AgentVillage.findOrCreate({
        where: { agent_id: agent.id, village: tv },
        defaults: {
          agent_id: agent.id,
          state: S,
          district: t.district,
          mandal: t.mandal,
          village: tv,
        },
      });
      if (made) created.territory += 1;
    }
  }

  // 4. Candidates + interests ──────────────────────────────────────
  for (const c of CANDIDATES) {
    const v = byVillage(c.village);
    let cand = await AgentCandidate.findOne({ where: { phone: c.phone } });

    if (!cand) {
      cand = await AgentCandidate.create({
        name: c.name,
        phone: c.phone,
        state: S,
        district: v.district,
        mandal: v.mandal,
        village: c.village,
        lead_source: c.source,
        status: c.status,
        candidate_type: c.interested.length > 1 ? "MULTIPLE_VILLAGE" : "NATIVE",
        assigned_employee_id: anyEmployee?.id ?? null,
        created_by: anyEmployee?.id ?? null,
        notes: "Sample candidate for end-to-end testing.",
      });

      await CandidateStatusHistory.create({
        candidate_id: cand.id,
        from_status: null,
        to_status: "NEW_LEAD",
        employee_id: anyEmployee?.id ?? null,
        notes: "Candidate created",
      });

      if (c.status !== "NEW_LEAD") {
        await CandidateStatusHistory.create({
          candidate_id: cand.id,
          from_status: "NEW_LEAD",
          to_status: c.status,
          employee_id: anyEmployee?.id ?? null,
          notes: "Sample pipeline movement",
        });
      }

      created.candidates += 1;
    }

    for (const iv of c.interested) {
      const t = byVillage(iv);
      const isNative = iv.toLowerCase() === (c.village || "").toLowerCase();

      const [, made] = await CandidateVillageInterest.findOrCreate({
        where: { candidate_id: cand.id, village: iv },
        defaults: {
          candidate_id: cand.id,
          state: S,
          district: t.district,
          mandal: t.mandal,
          village: iv,
          is_native: isNative,
          status: isNative ? "INTERESTED" : "NATIVE_PRIORITY_WAIT",
          interested_since: iso(daysAgo(10 + Math.floor(Math.random() * 90))),
        },
      });
      if (made) created.interests += 1;
    }
  }

  // 5. Village seats ───────────────────────────────────────────────
  // Sized the same way the API does it: acreage -> slab -> seat count.
  const { getRequiredAgentsSlabs, requiredAgentsFor } = await import(
    "../service/recruitmentService.js"
  );
  const slabs = await getRequiredAgentsSlabs();

  const acresByVillage = {};
  LANDS.forEach((l) => {
    acresByVillage[l.village] = (acresByVillage[l.village] || 0) + l.acres;
  });

  for (const [village, acres] of Object.entries(acresByVillage)) {
    const v = byVillage(village);
    const required = requiredAgentsFor(acres, slabs);
    const existing = await VillagePosition.count({ where: { village } });

    // Cap the sample at 5 seats a village; the slabs can ask for 50, which
    // makes the seats table unreadable for a walkthrough.
    const target = Math.min(required, 5);

    for (let n = existing + 1; n <= target; n += 1) {
      const agent = AGENTS.find((a) => a.village === village);
      await VillagePosition.create({
        position_number: n,
        state: S,
        district: v.district,
        mandal: v.mandal,
        village,
        // Seat 1 in a village that already has an agent reads as filled.
        status: n === 1 && agent ? "FILLED" : "NATIVE_SEARCH",
        agent_id: n === 1 && agent
          ? (await Agent.findOne({ where: { phone: agent.phone } }))?.id ?? null
          : null,
      });
      created.seats += 1;
    }
  }

  // 6. Call signals ────────────────────────────────────────────────
  const existingCalls = await CallSignal.count({ where: { department_type: "agents" } });
  if (existingCalls === 0) {
    const pool = [...AGENTS, ...CANDIDATES];
    for (let i = 0; i < 24; i += 1) {
      const who = pool[i % pool.length];
      const missed = i % 7 === 0;
      await CallSignal.create({
        employee_id: anyEmployee?.id ?? null,
        department_type: "agents",
        direction: i % 3 === 0 ? "inbound" : "outbound",
        caller_name: who.name,
        caller_phone: who.phone,
        caller_type: AGENTS.includes(who) ? "agent" : "candidate",
        mission_context: CALL_CONTEXTS[i % CALL_CONTEXTS.length],
        duration_seconds: missed ? 0 : 45 + Math.floor(Math.random() * 500),
        missed,
        status: missed ? "pending" : "resolved",
        created_at: daysAgo(i % 14),
      });
      created.calls += 1;
    }
  }

  // 7. Land observations ───────────────────────────────────────────
  const allAgents = await Agent.findAll({ limit: 8, order: [["id", "ASC"]] });
  for (const agent of allAgents) {
    const lands = await Land.findAll({
      where: { village: agent.village },
      limit: 2,
      order: [["id", "ASC"]],
    });
    for (const land of lands) {
      const [, made] = await LandObservation.findOrCreate({
        where: { land_id: land.id, agent_id: agent.id },
        defaults: { land_id: land.id, agent_id: agent.id },
      });
      if (made) created.observations += 1;
    }
    // Give each agent one primary land link too, so link counts are non-zero.
    if (lands[0] && !lands[0].agent_id) {
      await lands[0].update({ agent_id: agent.id });
    }
  }

  log("\nCreated:");
  Object.entries(created).forEach(([k, v]) => log(`  ${k.padEnd(14)} ${v}`));
  log("\nDone.\n");

  await sequelize.close();
};

seed().catch(async (err) => {
  console.error("\nSeed failed:", err.message);
  console.error(err.stack?.split("\n").slice(1, 4).join("\n"));
  process.exitCode = 1;
  await sequelize.close();
});
