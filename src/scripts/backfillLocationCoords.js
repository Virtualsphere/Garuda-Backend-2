/**
 * One-time seeding script: fills village.latitude/longitude and
 * mandal.latitude/longitude by geocoding place names against OpenStreetMap
 * Nominatim.
 *
 * This runs OFFLINE as a manual step. The API never calls Nominatim at
 * runtime — /api/fieldwork/map-nodes reads only what this script wrote.
 *
 * These coordinates are a FALLBACK. A village that has lands with real GPS is
 * positioned at the centroid of those lands instead.
 *
 *   node src/scripts/backfillLocationCoords.js            # only fill nulls
 *   node src/scripts/backfillLocationCoords.js --force    # re-geocode everything
 *   node src/scripts/backfillLocationCoords.js --mandals-only
 *
 * Nominatim's usage policy caps us at 1 request/second and requires a real
 * User-Agent, so a full run over a few thousand villages takes ~1 hour.
 */

import sequelize from "../db/db.js";
import "../model/associationModel.js";
import Village from "../model/villageModel.js";
import Mandal from "../model/mandalModel.js";
import District from "../model/districtModel.js";
import State from "../model/stateModel.js";

const NOMINATIM   = "https://nominatim.openstreetmap.org/search";
const USER_AGENT  = "Garuda-Admin/1.0 (location coordinate backfill)";
const RATE_LIMIT_MS = 1100; // Nominatim policy: max 1 req/sec

const force       = process.argv.includes("--force");
const mandalsOnly = process.argv.includes("--mandals-only");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Resolve a place name to { lat, lng }, or null if Nominatim has no match. */
const geocode = async (query) => {
  const url = `${NOMINATIM}?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;

  let response;
  try {
    response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  } catch (error) {
    console.warn(`  ! network error for "${query}": ${error.message}`);
    return null;
  }

  if (response.status === 429) {
    console.warn("  ! rate limited — backing off 10s");
    await sleep(10_000);
    return geocode(query);
  }
  if (!response.ok) {
    console.warn(`  ! HTTP ${response.status} for "${query}"`);
    return null;
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
};

/** Geocode one row and persist the result. Returns 'hit' | 'miss'. */
const backfillRow = async (row, query) => {
  const coords = await geocode(query);
  await sleep(RATE_LIMIT_MS);

  if (!coords) {
    console.log(`  miss  ${query}`);
    return "miss";
  }

  row.latitude = coords.lat;
  row.longitude = coords.lng;
  await row.save();
  console.log(`  ok    ${query} -> ${coords.lat}, ${coords.lng}`);
  return "hit";
};

const needsCoords = (row) => force || row.latitude == null || row.longitude == null;

const run = async () => {
  await sequelize.authenticate();

  const tally = { hit: 0, miss: 0, skipped: 0 };

  // ── Mandals first: they are the fallback for villages that miss ──────────
  const mandals = await Mandal.findAll({
    include: [{
      model: District,
      as: "district",
      include: [{ model: State, as: "state" }],
    }],
  });

  console.log(`\nMandals (${mandals.length})`);
  for (const mandal of mandals) {
    if (!needsCoords(mandal)) { tally.skipped++; continue; }

    const parts = [
      mandal.name,
      mandal.district?.name,
      mandal.district?.state?.name,
      "India",
    ].filter(Boolean);

    tally[await backfillRow(mandal, parts.join(", "))]++;
  }

  // ── Villages ─────────────────────────────────────────────────────────────
  if (!mandalsOnly) {
    const villages = await Village.findAll({
      include: [{
        model: Mandal,
        as: "mandal",
        include: [{
          model: District,
          as: "district",
          include: [{ model: State, as: "state" }],
        }],
      }],
    });

    console.log(`\nVillages (${villages.length})`);
    for (const village of villages) {
      if (!needsCoords(village)) { tally.skipped++; continue; }

      const parts = [
        village.name,
        village.mandal?.name,
        village.mandal?.district?.name,
        village.mandal?.district?.state?.name,
        "India",
      ].filter(Boolean);

      tally[await backfillRow(village, parts.join(", "))]++;
    }
  }

  console.log(
    `\nDone. ${tally.hit} geocoded, ${tally.miss} not found, ${tally.skipped} already had coordinates.`
  );
  console.log("Rows that were not found fall back to their mandal, then render without a pin.");

  await sequelize.close();
};

run().catch(async (error) => {
  console.error("Backfill failed:", error);
  await sequelize.close();
  process.exit(1);
});
