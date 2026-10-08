/**
 * Fills an EMPTY local location master (state -> district -> mandal -> village,
 * plus town under district) with a copy of the live server's tree.
 *
 * For local development: a fresh database has no locations, so every cascading
 * dropdown in the admin is blank. The live tree comes from the public
 * GET /api/location, and the rows are written straight through the models, so
 * no login token is needed (unlike seedLocations.js, which goes through the
 * authenticated POST routes).
 *
 * Refuses to run unless the target database has no states at all -- this is a
 * one-shot copy, never a merge, and must not touch a database that is in use.
 * Ids are fresh; nothing outside the location tables references them (land,
 * leads and assignments store place NAMES).
 *
 *   node src/scripts/copyLocationsFromRemote.js           # dry run, counts only
 *   node src/scripts/copyLocationsFromRemote.js --apply   # write
 *
 * Source defaults to production; override with LOCATION_SOURCE_API.
 */

import sequelize from "../db/db.js";
import { State, District, Mandal, Village, Town } from "../model/associationModel.js";

const SOURCE = process.env.LOCATION_SOURCE_API || "https://backend.garudalands.com/api";
const apply = process.argv.slice(2).includes("--apply");

const name = (raw) => String(raw ?? "").trim();
const coords = (row) => ({
  latitude: row.latitude ?? null,
  longitude: row.longitude ?? null,
});

const run = async () => {
  const existing = await State.count();
  if (existing > 0) {
    console.error(
      `Target database already has ${existing} state(s). This script only fills an empty ` +
        "location master -- nothing was written. Use seedLocations.js to add to an existing one."
    );
    process.exit(1);
  }

  const response = await fetch(`${SOURCE}/location`);
  if (!response.ok) throw new Error(`GET ${SOURCE}/location -> ${response.status}`);
  const tree = (await response.json()).data || [];

  const tally = { state: 0, district: 0, town: 0, mandal: 0, village: 0 };
  for (const s of tree) {
    tally.state++;
    for (const d of s.districts || []) {
      tally.district++;
      tally.town += (d.towns || []).length;
      for (const m of d.mandals || []) {
        tally.mandal++;
        tally.village += (m.villages || []).length;
      }
    }
  }

  const summary = Object.entries(tally).map(([k, n]) => `${n} ${k}`).join(", ");
  console.log(`Source: ${SOURCE}`);
  if (!apply) {
    console.log(`Would create: ${summary}.\nRe-run with --apply to write.`);
    return;
  }

  // One transaction: a half-copied tree is worse than none.
  await sequelize.transaction(async (transaction) => {
    for (const s of tree) {
      const state = await State.create({ name: name(s.name) }, { transaction });

      for (const d of s.districts || []) {
        const district = await District.create(
          { name: name(d.name), state_id: state.id },
          { transaction }
        );

        if ((d.towns || []).length) {
          await Town.bulkCreate(
            d.towns.map((t) => ({ name: name(t.name), district_id: district.id })),
            { transaction }
          );
        }

        for (const m of d.mandals || []) {
          const mandal = await Mandal.create(
            { name: name(m.name), district_id: district.id, ...coords(m) },
            { transaction }
          );

          if ((m.villages || []).length) {
            await Village.bulkCreate(
              m.villages.map((v) => ({ name: name(v.name), mandal_id: mandal.id, ...coords(v) })),
              { transaction }
            );
          }
        }
      }
    }
  });

  console.log(`Created: ${summary}.`);
};

run()
  .catch((error) => {
    console.error("Copy failed (nothing was written):", error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
