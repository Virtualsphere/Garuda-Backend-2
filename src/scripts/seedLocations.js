/**
 * Rebuilds the location master tables (state -> district -> mandal -> village,
 * plus town under district) through the public /api/location endpoints.
 *
 * Nothing outside the location tables references these rows by id -- land,
 * assigned_village and employee_town all store location NAMES as strings -- so
 * re-seeding with fresh ids is safe and needs no id preservation.
 *
 * Idempotent: it reads the current hierarchy from GET /location first and only
 * creates what is missing, so a partial run can be resumed by re-running.
 *
 *   node src/scripts/seedLocations.js --from-land             # dry run, preview
 *   node src/scripts/seedLocations.js --from-land --apply     # write
 *   node src/scripts/seedLocations.js --file=telangana.json --apply
 *
 * --from-land derives the hierarchy from names already present on land rows.
 * That only covers places field staff have actually filed land in, so it is a
 * stopgap to unblock the dropdowns -- prefer --file with a full master list.
 *
 * Expected --file shape:
 *   [{ "name": "Telangana",
 *      "districts": [{ "name": "Wanaparthy",
 *                      "towns":   ["Wanaparthy"],
 *                      "mandals": [{ "name": "Pangal",
 *                                    "villages": ["Kothapet"] }] }] }]
 */

const API = process.env.GARUDA_API || "https://backend.garudalands.com/api";
const TOKEN = process.env.GARUDA_TOKEN || "";

const apply    = process.argv.includes("--apply");
const fromLand = process.argv.includes("--from-land");
const fileArg  = process.argv.find((a) => a.startsWith("--file="));
const keepCase = process.argv.includes("--preserve-case");

/** Place names arrive with stray spaces and inconsistent case ("khammam"). */
const clean = (raw) => {
  const collapsed = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!collapsed) return "";
  if (keepCase) return collapsed;
  return collapsed.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
};

const key = (name) => clean(name).toLowerCase();

const request = async (method, path, body) => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${payload.message || ""}`);
  }
  return payload.data ?? payload;
};

/* ── Build the desired hierarchy ──────────────────────────────────────────── */

/** Nested Maps keyed by lowercased name, so duplicates collapse by case. */
const emptyState = (name) => ({ name, districts: new Map() });
const emptyDistrict = (name) => ({ name, mandals: new Map(), towns: new Map() });
const emptyMandal = (name) => ({ name, villages: new Map() });
const leaf = (name) => ({ name });

const upsert = (map, name, make) => {
  const k = key(name);
  if (!k) return null;
  if (!map.has(k)) map.set(k, make(clean(name)));
  return map.get(k);
};

const hierarchyFromLand = async () => {
  const lands = await request("GET", "/land");
  const states = new Map();

  for (const land of lands) {
    const state = upsert(states, land.state, emptyState);
    if (!state) continue;

    const district = upsert(state.districts, land.district, emptyDistrict);
    if (!district) continue;

    for (const town of [land.nearest_town_1, land.nearest_town_2, land.nearest_town_3]) {
      upsert(district.towns, town, leaf);
    }

    const mandal = upsert(district.mandals, land.mandal, emptyMandal);
    if (!mandal) continue;

    upsert(mandal.villages, land.village, leaf);
  }

  return states;
};

const hierarchyFromFile = async (path) => {
  const { readFile } = await import("node:fs/promises");
  const parsed = JSON.parse(await readFile(path, "utf8"));
  const states = new Map();

  for (const rawState of parsed) {
    const state = upsert(states, rawState.name, emptyState);
    if (!state) continue;

    for (const rawDistrict of rawState.districts ?? []) {
      const district = upsert(state.districts, rawDistrict.name, emptyDistrict);
      if (!district) continue;

      for (const town of rawDistrict.towns ?? []) {
        upsert(district.towns, town, leaf);
      }

      for (const rawMandal of rawDistrict.mandals ?? []) {
        const mandal = upsert(district.mandals, rawMandal.name, emptyMandal);
        if (!mandal) continue;

        for (const village of rawMandal.villages ?? []) {
          upsert(mandal.villages, village, leaf);
        }
      }
    }
  }

  return states;
};

/* ── Reconcile against what is already there ──────────────────────────────── */

const tally = { state: 0, district: 0, mandal: 0, town: 0, village: 0 };

/**
 * Find `name` among `existing` (by lowercased name) or create it. Returns null
 * in dry-run mode, where no id exists yet -- the caller then reports the whole
 * subtree as pending rather than querying for children that cannot be there.
 */
const ensure = async (kind, existing, name, createPath, payload, indent) => {
  const match = existing.find((row) => key(row.name) === key(name));
  if (match) return match.id;

  tally[kind]++;
  console.log(`${indent}+ ${kind} ${clean(name)}`);
  if (!apply) return null;

  const created = await request("POST", createPath, { name: clean(name), ...payload });
  return created.id;
};

/** Dry-run reporting for a subtree whose parent does not exist yet. */
const reportPendingDistrict = (district, indent) => {
  for (const town of district.towns.values()) {
    tally.town++;
    console.log(`${indent}+ town ${town.name}`);
  }
  for (const mandal of district.mandals.values()) {
    tally.mandal++;
    console.log(`${indent}+ mandal ${mandal.name}`);
    for (const village of mandal.villages.values()) {
      tally.village++;
      console.log(`${indent}  + village ${village.name}`);
    }
  }
};

const run = async () => {
  if (!fromLand && !fileArg) {
    console.error("Pass --from-land or --file=<path>. See the header comment.");
    process.exit(1);
  }

  const desired = fromLand
    ? await hierarchyFromLand()
    : await hierarchyFromFile(fileArg.slice("--file=".length));

  console.log(`API: ${API}`);
  console.log(apply ? "Mode: APPLY (writing)\n" : "Mode: dry run (pass --apply to write)\n");

  const existingStates = await request("GET", "/location");

  for (const state of desired.values()) {
    const stateId = await ensure("state", existingStates, state.name, "/location/state", {}, "");
    console.log(`  state ${state.name}`);

    const existingDistricts = stateId ? await request("GET", `/location/districts/${stateId}`) : [];

    for (const district of state.districts.values()) {
      const districtId = await ensure(
        "district", existingDistricts, district.name,
        "/location/district", { state_id: stateId }, "    "
      );

      if (!districtId) {
        reportPendingDistrict(district, "      ");
        continue;
      }

      const existingTowns = await request("GET", `/location/towns/${districtId}`);
      for (const town of district.towns.values()) {
        await ensure("town", existingTowns, town.name,
          "/location/town", { district_id: districtId }, "      ");
      }

      const existingMandals = await request("GET", `/location/mandals/${districtId}`);
      for (const mandal of district.mandals.values()) {
        const mandalId = await ensure(
          "mandal", existingMandals, mandal.name,
          "/location/mandal", { district_id: districtId }, "      "
        );

        if (!mandalId) {
          for (const village of mandal.villages.values()) {
            tally.village++;
            console.log(`        + village ${village.name}`);
          }
          continue;
        }

        const existingVillages = await request("GET", `/location/villages/${mandalId}`);
        for (const village of mandal.villages.values()) {
          await ensure("village", existingVillages, village.name,
            "/location/village", { mandal_id: mandalId }, "        ");
        }
      }
    }
  }

  const summary = Object.entries(tally).map(([kind, n]) => `${n} ${kind}`).join(", ");
  console.log(`\n${apply ? "Created" : "Would create"}: ${summary}.`);
  if (!apply) console.log("Re-run with --apply to write these rows.");
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
