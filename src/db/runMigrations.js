import sequelize from "./db.js";
import MIGRATIONS from "../migrations/index.js";

/**
 * Run every migration in src/migrations that this database has not run yet.
 * Each migration and its schema_migrations record commit in one transaction,
 * so a failed migration is rolled back and retried on the next boot.
 */
const runMigrations = async () => {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name   VARCHAR(255) PRIMARY KEY,
       run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );

  const [rows] = await sequelize.query(`SELECT name FROM schema_migrations`);
  const done = new Set(rows.map((r) => r.name));

  for (const migration of MIGRATIONS) {
    if (done.has(migration.name)) continue;

    console.log(`Running migration ${migration.name}`);
    await sequelize.transaction(async (transaction) => {
      await migration.up(sequelize, transaction);
      await sequelize.query(
        `INSERT INTO schema_migrations (name) VALUES (:name)`,
        { replacements: { name: migration.name }, transaction }
      );
    });
  }
};

export default runMigrations;
