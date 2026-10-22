/**
 * One-off data migrations, run on boot by src/db/runMigrations.js.
 *
 * Each runs exactly once per database — its name is recorded in the
 * schema_migrations table. Add new migrations to the END of this list and
 * never rename one that has shipped, or it will run again.
 */
import * as privateFarmerMedia from "./20261022-private-farmer-media.js";

const MIGRATIONS = [
  privateFarmerMedia,
];

export default MIGRATIONS;
