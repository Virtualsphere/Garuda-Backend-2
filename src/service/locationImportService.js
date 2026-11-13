import ExcelJS from "exceljs";
import { Op } from "sequelize";
import sequelize from "../db/db.js";
import State from "../model/stateModel.js";
import District from "../model/districtModel.js";
import Mandal from "../model/mandalModel.js";
import Village from "../model/villageModel.js";
import Town from "../model/townModel.js";

/**
 * Bulk location import from an Excel (.xlsx) or CSV sheet.
 *
 * One row per village (the format of the state village lists we receive):
 *
 *   State | District | Mandal | Village | Town (optional)
 *
 * - Header names are matched loosely ("State Name", "MANDAL", "Tehsil" …).
 * - Every level is matched to existing rows by name within its parent,
 *   ignoring case and extra whitespace, so re-importing the same sheet — or a
 *   sheet that overlaps what is already there — only adds what is missing.
 * - A row may stop early: State+District alone adds a district, without a
 *   Village it adds up to the mandal. Town (a district-level place) is optional.
 * - Rows with problems are skipped and reported by sheet/row number; the rest
 *   are imported in one transaction. Run with dryRun first to preview.
 */

export const MAX_ROWS = 50000;
const MAX_NAME_LENGTH = 255;
const MAX_REPORTED_ERRORS = 200;
const SAMPLE_SIZE = 15;
const INSERT_CHUNK = 1000;

const LEVELS = ["state", "district", "mandal", "village", "town"];

const HEADER_ALIASES = {
  state: ["state", "statename", "stname"],
  district: ["district", "districtname", "dist", "distname"],
  mandal: ["mandal", "mandalname", "tehsil", "taluk", "taluka", "block", "subdistrict", "subdistrictname"],
  village: ["village", "villagename", "revenuevillage", "revenuevillagename"],
  town: ["town", "townname", "city", "municipality"],
};

export class ImportError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

/** Display form of a name: trimmed, inner whitespace collapsed. */
const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
/** Comparison key: clean + case-insensitive. */
const keyOf = (v) => clean(v).toLowerCase();
const headerKey = (v) => String(v ?? "").toLowerCase().replace(/[^a-z]/g, "");

/* =====================================================
   PARSING
===================================================== */

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
};

/** Text of an ExcelJS cell regardless of its type (rich text, formula, number, hyperlink). */
const cellText = (cell) => {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return v.result ?? "";
    if ("text" in v) return typeof v.text === "string" ? v.text : cellText({ value: v.text });
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v);
};

/** Find the header row (within the first 10 rows) and map each level to a column index. */
const detectColumns = (grid) => {
  for (let r = 0; r < Math.min(grid.length, 10); r++) {
    const columns = {};
    (grid[r] || []).forEach((cell, c) => {
      const h = headerKey(cell);
      for (const level of LEVELS) {
        if (columns[level] === undefined && HEADER_ALIASES[level].includes(h)) columns[level] = c;
      }
    });
    if (columns.state !== undefined && columns.district !== undefined) {
      return { headerRow: r, columns, headers: grid[r] };
    }
  }
  return null;
};

/**
 * Read every sheet that has a recognisable header into
 * [{ sheet, row (1-based, as Excel shows it), state, district, mandal, village, town }].
 */
export const parseFile = async (buffer, filename = "") => {
  const ext = filename.toLowerCase().split(".").pop();
  const sheets = [];

  if (ext === "csv") {
    sheets.push({ name: "CSV", grid: parseCsv(buffer.toString("utf8")) });
  } else if (ext === "xlsx") {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer);
    } catch {
      throw new ImportError("Could not read the file. Save it as .xlsx (Excel Workbook) or .csv and try again.");
    }
    wb.eachSheet((ws) => {
      if (ws.state && ws.state !== "visible") return;
      const grid = [];
      ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const cells = [];
        row.eachCell({ includeEmpty: true }, (cell, col) => { cells[col - 1] = cellText(cell); });
        grid[rowNumber - 1] = cells;
      });
      sheets.push({ name: ws.name, grid: Array.from(grid, (r) => r || []) });
    });
  } else {
    throw new ImportError("Unsupported file type. Upload an Excel .xlsx or a .csv file (old .xls files must be re-saved as .xlsx).");
  }

  const rows = [];
  const usedSheets = [];
  let columnsUsed = null;

  for (const { name, grid } of sheets) {
    const detected = detectColumns(grid);
    if (!detected) continue;
    usedSheets.push(name);
    columnsUsed ||= Object.fromEntries(
      Object.entries(detected.columns).map(([level, c]) => [level, clean(detected.headers[c])])
    );

    for (let r = detected.headerRow + 1; r < grid.length; r++) {
      const cells = grid[r] || [];
      const entry = { sheet: name, row: r + 1 };
      for (const level of LEVELS) {
        const c = detected.columns[level];
        entry[level] = c === undefined ? "" : clean(cells[c]);
      }
      if (LEVELS.every((l) => !entry[l])) continue; // blank line
      rows.push(entry);
      if (rows.length > MAX_ROWS) {
        throw new ImportError(`The file has more than ${MAX_ROWS.toLocaleString("en-IN")} rows. Split it into smaller files.`);
      }
    }
  }

  if (!usedSheets.length) {
    throw new ImportError(
      'No sheet has a header row with at least "State" and "District" columns (optional: Mandal, Village, Town).'
    );
  }

  return { rows, sheets: usedSheets, columns: columnsUsed };
};

/* =====================================================
   PLANNING — what exists, what must be created
===================================================== */

/**
 * Load the existing rows below the states named in the file, keyed for
 * name lookup: states by name, everything else by `${parentId}|${name}`.
 */
const loadExisting = async (stateKeys, transaction) => {
  const states = await State.findAll({ attributes: ["id", "name"], transaction });
  const stateMap = new Map();
  for (const s of states) if (!stateMap.has(keyOf(s.name))) stateMap.set(keyOf(s.name), s.id);

  const stateIds = [...stateKeys].map((k) => stateMap.get(k)).filter(Boolean);
  const districts = stateIds.length
    ? await District.findAll({ where: { state_id: { [Op.in]: stateIds } }, attributes: ["id", "name", "state_id"], transaction })
    : [];
  const districtIds = districts.map((d) => d.id);

  const [mandals, towns] = districtIds.length
    ? await Promise.all([
        Mandal.findAll({ where: { district_id: { [Op.in]: districtIds } }, attributes: ["id", "name", "district_id"], transaction }),
        Town.findAll({ where: { district_id: { [Op.in]: districtIds } }, attributes: ["id", "name", "district_id"], transaction }),
      ])
    : [[], []];
  const mandalIds = mandals.map((m) => m.id);

  const villages = mandalIds.length
    ? await Village.findAll({ where: { mandal_id: { [Op.in]: mandalIds } }, attributes: ["id", "name", "mandal_id"], transaction })
    : [];

  const index = (list, parentKey) => {
    const map = new Map();
    for (const item of list) {
      const k = `${item[parentKey]}|${keyOf(item.name)}`;
      if (!map.has(k)) map.set(k, item.id);
    }
    return map;
  };

  return {
    state: stateMap,
    district: index(districts, "state_id"),
    mandal: index(mandals, "district_id"),
    town: index(towns, "district_id"),
    village: index(villages, "mandal_id"),
  };
};

/**
 * Walk the rows and decide, per level, which names already exist and which
 * must be created. New parents are referenced by a placeholder ("new:<n>")
 * until they are inserted and get a real id.
 */
const buildPlan = (rows, existing) => {
  const errors = [];
  const pending = { state: [], district: [], mandal: [], town: [], village: [] };
  const newRefs = new Map(); // `${level}|${parentRef}|${key}` → "new:<level>:<n>"
  const matched = { state: new Set(), district: new Set(), mandal: new Set(), town: new Set(), village: new Set() };
  const seenRows = new Set();
  let duplicateRows = 0;
  let validRows = 0;

  const resolve = (level, parentRef, name) => {
    const k = keyOf(name);
    // Existing parent → look it up in the DB index. A new parent has no DB children.
    if (typeof parentRef !== "string" || !parentRef.startsWith("new:")) {
      const lookup = level === "state" ? existing.state.get(k) : existing[level].get(`${parentRef}|${k}`);
      if (lookup) {
        matched[level].add(lookup);
        return lookup;
      }
    }
    const refKey = `${level}|${parentRef}|${k}`;
    if (!newRefs.has(refKey)) {
      const ref = `new:${level}:${pending[level].length}`;
      newRefs.set(refKey, ref);
      pending[level].push({ ref, parentRef, name });
    }
    return newRefs.get(refKey);
  };

  for (const r of rows) {
    const where = { sheet: r.sheet, row: r.row };
    const problem =
      !r.state ? "State is empty" :
      !r.district ? "District is empty" :
      r.village && !r.mandal ? "Village is given but Mandal is empty" :
      LEVELS.find((l) => r[l].length > MAX_NAME_LENGTH) ? `A name is longer than ${MAX_NAME_LENGTH} characters` :
      null;
    if (problem) {
      errors.push({ ...where, message: problem });
      continue;
    }

    const rowKey = LEVELS.map((l) => keyOf(r[l])).join("|");
    if (seenRows.has(rowKey)) {
      duplicateRows++;
      continue;
    }
    seenRows.add(rowKey);
    validRows++;

    const stateRef = resolve("state", null, r.state);
    const districtRef = resolve("district", stateRef, r.district);
    if (r.town) resolve("town", districtRef, r.town);
    if (r.mandal) {
      const mandalRef = resolve("mandal", districtRef, r.mandal);
      if (r.village) resolve("village", mandalRef, r.village);
    }
  }

  return { pending, matched, errors, duplicateRows, validRows };
};

/* =====================================================
   EXECUTION
===================================================== */

const insertLevel = async (Model, items, parentField, refIds, transaction) => {
  for (let i = 0; i < items.length; i += INSERT_CHUNK) {
    const chunk = items.slice(i, i + INSERT_CHUNK);
    const created = await Model.bulkCreate(
      chunk.map((item) => {
        const attrs = { name: item.name };
        if (parentField) {
          const parentId = refIds.get(item.parentRef) ?? item.parentRef;
          attrs[parentField] = parentId;
        }
        return attrs;
      }),
      { transaction, returning: ["id"] }
    );
    created.forEach((row, j) => refIds.set(chunk[j].ref, row.id));
  }
};

const summarise = ({ pending, matched, errors, duplicateRows, validRows }, parsed, dryRun) => {
  const count = (level) => pending[level].length;
  return {
    dryRun,
    sheets: parsed.sheets,
    columns: parsed.columns,
    totalRows: parsed.rows.length,
    validRows,
    duplicateRows,
    skippedRows: errors.length,
    created: {
      states: count("state"),
      districts: count("district"),
      mandals: count("mandal"),
      towns: count("town"),
      villages: count("village"),
    },
    existing: {
      states: matched.state.size,
      districts: matched.district.size,
      mandals: matched.mandal.size,
      towns: matched.town.size,
      villages: matched.village.size,
    },
    samples: {
      states: pending.state.slice(0, SAMPLE_SIZE).map((p) => p.name),
      districts: pending.district.slice(0, SAMPLE_SIZE).map((p) => p.name),
      mandals: pending.mandal.slice(0, SAMPLE_SIZE).map((p) => p.name),
      towns: pending.town.slice(0, SAMPLE_SIZE).map((p) => p.name),
      villages: pending.village.slice(0, SAMPLE_SIZE).map((p) => p.name),
    },
    errors: errors.slice(0, MAX_REPORTED_ERRORS),
    errorsTruncated: errors.length > MAX_REPORTED_ERRORS,
  };
};

/**
 * Parse, plan and (unless dryRun) write the import.
 * The plan is rebuilt inside the write transaction so it reflects the DB at
 * the moment of writing, not at preview time.
 */
export const importLocations = async (buffer, filename, { dryRun = true } = {}) => {
  const parsed = await parseFile(buffer, filename);
  if (!parsed.rows.length) throw new ImportError("The sheet has a header row but no data rows.");

  const stateKeys = new Set(parsed.rows.map((r) => keyOf(r.state)).filter(Boolean));

  if (dryRun) {
    const plan = buildPlan(parsed.rows, await loadExisting(stateKeys));
    return summarise(plan, parsed, true);
  }

  return sequelize.transaction(async (transaction) => {
    const plan = buildPlan(parsed.rows, await loadExisting(stateKeys, transaction));
    const refIds = new Map();
    await insertLevel(State, plan.pending.state, null, refIds, transaction);
    await insertLevel(District, plan.pending.district, "state_id", refIds, transaction);
    await insertLevel(Town, plan.pending.town, "district_id", refIds, transaction);
    await insertLevel(Mandal, plan.pending.mandal, "district_id", refIds, transaction);
    await insertLevel(Village, plan.pending.village, "mandal_id", refIds, transaction);
    return summarise(plan, parsed, false);
  });
};

/* =====================================================
   TEMPLATE
===================================================== */

export const buildTemplate = async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Locations");
  ws.columns = [
    { header: "State", key: "state", width: 20 },
    { header: "District", key: "district", width: 26 },
    { header: "Mandal", key: "mandal", width: 24 },
    { header: "Village", key: "village", width: 28 },
    { header: "Town", key: "town", width: 22 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.addRows([
    { state: "Telangana", district: "Rangareddy", mandal: "Shankarpally", village: "Mokila", town: "" },
    { state: "Telangana", district: "Rangareddy", mandal: "Shankarpally", village: "Kondakal", town: "" },
    { state: "Telangana", district: "Rangareddy", mandal: "", village: "", town: "Shamshabad" },
  ]);
  ws.views = [{ state: "frozen", ySplit: 1 }];
  return wb.xlsx.writeBuffer();
};
