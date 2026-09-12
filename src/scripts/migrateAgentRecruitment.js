/**
 * Agent recruitment schema migration.
 *
 * Creates the four recruitment tables and adds the agent lifecycle columns.
 * Every statement is idempotent (IF NOT EXISTS), so re-running is safe.
 *
 * THIS DOES NOT RUN ON BOOT. Run it deliberately, against a database you have
 * checked, after pointing your .env at it:
 *
 *   node src/scripts/migrateAgentRecruitment.js
 *
 * It prints the target host and database first and refuses to continue unless
 * you pass --yes, so it cannot be run against the wrong server by accident.
 */
import dotenv from "dotenv";
import sequelize from "../db/db.js";

dotenv.config();

const STATEMENTS = [
  // ── agent lifecycle columns ─────────────────────────────────────
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS alternate_phone   VARCHAR(255)`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS email             VARCHAR(255)`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS address           TEXT`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS joining_date      DATE`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS status            VARCHAR(255) DEFAULT 'ACTIVE'`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS membership_status VARCHAR(255) DEFAULT 'PENDING'`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS membership_amount NUMERIC(12,2) DEFAULT 0`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS commission_earned NUMERIC(12,2) DEFAULT 0`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS commission_paid   NUMERIC(12,2) DEFAULT 0`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS lead_source       VARCHAR(255)`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS rating            NUMERIC(3,2)`,
  `ALTER TABLE agent ADD COLUMN IF NOT EXISTS source_candidate_id INTEGER`,

  // ── agent_candidate ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS agent_candidate (
     id                   SERIAL PRIMARY KEY,
     name                 VARCHAR(255) NOT NULL,
     phone                VARCHAR(255) NOT NULL,
     alternate_phone      VARCHAR(255),
     email                VARCHAR(255),
     state                VARCHAR(255),
     district             VARCHAR(255),
     mandal               VARCHAR(255),
     village              VARCHAR(255),
     lead_source          VARCHAR(255) DEFAULT 'DIRECT',
     candidate_type       VARCHAR(255) DEFAULT 'NATIVE',
     status               VARCHAR(255) NOT NULL DEFAULT 'NEW_LEAD',
     call_status          VARCHAR(255),
     assigned_employee_id INTEGER,
     team_leader_id       INTEGER,
     converted_agent_id   INTEGER,
     selected_village     VARCHAR(255),
     notes                TEXT,
     created_by           INTEGER,
     created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS agent_candidate_phone_idx   ON agent_candidate (phone)`,
  `CREATE INDEX IF NOT EXISTS agent_candidate_status_idx  ON agent_candidate (status)`,
  `CREATE INDEX IF NOT EXISTS agent_candidate_village_idx ON agent_candidate (village)`,

  // ── candidate_status_history ────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS candidate_status_history (
     id           SERIAL PRIMARY KEY,
     candidate_id INTEGER NOT NULL,
     from_status  VARCHAR(255),
     to_status    VARCHAR(255) NOT NULL,
     employee_id  INTEGER,
     notes        TEXT,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS candidate_status_history_candidate_idx
     ON candidate_status_history (candidate_id)`,

  // ── village_agent_position ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS village_agent_position (
     id                    SERIAL PRIMARY KEY,
     position_number       INTEGER NOT NULL DEFAULT 1,
     state                 VARCHAR(255),
     district              VARCHAR(255),
     mandal                VARCHAR(255),
     village               VARCHAR(255) NOT NULL,
     status                VARCHAR(255) NOT NULL DEFAULT 'VACANT',
     agent_id              INTEGER,
     selected_candidate_id INTEGER,
     is_native             BOOLEAN,
     opened_to_waiting_at  TIMESTAMPTZ,
     opened_by             INTEGER,
     opened_remarks        TEXT,
     created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS village_agent_position_village_idx ON village_agent_position (village)`,
  `CREATE INDEX IF NOT EXISTS village_agent_position_status_idx  ON village_agent_position (status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS village_agent_position_seat_idx
     ON village_agent_position (village, mandal, position_number)`,

  // ── candidate_village_interest ──────────────────────────────────
  `CREATE TABLE IF NOT EXISTS candidate_village_interest (
     id               SERIAL PRIMARY KEY,
     candidate_id     INTEGER NOT NULL,
     state            VARCHAR(255),
     district         VARCHAR(255),
     mandal           VARCHAR(255),
     village          VARCHAR(255) NOT NULL,
     is_native        BOOLEAN NOT NULL DEFAULT FALSE,
     status           VARCHAR(255) NOT NULL DEFAULT 'INTERESTED',
     interested_since DATE,
     notes            TEXT,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS candidate_village_interest_village_idx
     ON candidate_village_interest (village)`,
  `CREATE INDEX IF NOT EXISTS candidate_village_interest_status_idx
     ON candidate_village_interest (status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS candidate_village_interest_unique_idx
     ON candidate_village_interest (candidate_id, village)`,
];

const run = async () => {
  const host = process.env.PGHOST;
  const database = process.env.PGDATABASE;

  console.log("─".repeat(64));
  console.log("Agent recruitment migration");
  console.log(`  host:     ${host}`);
  console.log(`  database: ${database}`);
  console.log(`  changes:  12 columns on "agent", 4 new tables`);
  console.log("─".repeat(64));

  if (!process.argv.includes("--yes")) {
    console.log("\nDry run. Nothing has been changed.");
    console.log("Check the host and database above, then re-run with --yes:\n");
    console.log("  node src/scripts/migrateAgentRecruitment.js --yes\n");
    await sequelize.close();
    return;
  }

  let applied = 0;
  try {
    for (const statement of STATEMENTS) {
      await sequelize.query(statement);
      applied += 1;
    }
    console.log(`\nApplied ${applied} of ${STATEMENTS.length} statements. Done.`);
  } catch (error) {
    console.error(`\nFailed on statement ${applied + 1}:`);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
