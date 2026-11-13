import { Op } from "sequelize";
import PropertyListing from "../model/propertyListingModel.js";
import { State, District, Town } from "../model/associationModel.js";

/* =====================================================
   FIELD SCHEMAS — one per listing form (fields 02-13)
   Keys not listed here are dropped, so `details` only ever holds known fields.
===================================================== */

export const LISTING_TYPES = ["home", "plot", "venture", "villa"];
export const LISTING_STATUSES = ["pending", "approved", "rejected"];

const FACINGS = ["E", "W", "N", "S", "NE", "NW", "SE", "SW"];
const APPROVAL_TYPES = ["hmda", "dtcp", "municipal", "panchayat", "unapproved"];

const DETAIL_SCHEMAS = {
  home: {
    property_type: { type: "enum", values: ["independent_house", "duplex", "apartment", "other"], required: true },
    property_type_other: { type: "text" },
    property_status: { type: "enum", values: ["new", "resale", "under_construction"] },
    property_age_years: { type: "number" },
    built_up_area_sqft: { type: "number" },
    plot_area_sq_yards: { type: "number" },
    plot_area_not_applicable: { type: "bool" },
    total_floors: { type: "int" },
    property_floor: { type: "int" },
    bedrooms: { type: "int" },
    bathrooms: { type: "int" },
    facing: { type: "enum", values: FACINGS },
    furnishing: { type: "enum", values: ["furnished", "semi_furnished", "unfurnished"] },
    asking_price: { type: "number" },
    negotiable: { type: "bool" },
    parking: { type: "enum", values: ["car", "two_wheeler", "both", "none"] },
    utilities: { type: "multi", values: ["water", "power", "drainage", "lift", "security"] },
  },
  plot: {
    venture_name: { type: "text" },
    plot_number: { type: "text" },
    plot_type: { type: "enum", values: ["residential", "commercial"], required: true },
    plot_size_sq_yards: { type: "number" },
    length_ft: { type: "number" },
    width_ft: { type: "number" },
    facing: { type: "enum", values: FACINGS },
    price_per_sq_yard: { type: "number" },
    total_price: { type: "number" },
    total_price_auto: { type: "bool" },
    approval_type: { type: "enum", values: APPROVAL_TYPES },
    road_width_ft: { type: "number" },
    road_type: { type: "enum", values: ["bt", "cc", "gravel", "other"] },
    amenities: { type: "multi", values: ["water", "power", "drainage", "corner_plot"] },
  },
  venture: {
    venture_name: { type: "text", required: true },
    venture_type: { type: "enum", values: ["residential", "commercial", "mixed"], required: true },
    area_acres: { type: "number" },
    area_guntas: { type: "number" },
    total_plots: { type: "int" },
    available_plots: { type: "int" },
    plot_size_min_sq_yards: { type: "number" },
    plot_size_max_sq_yards: { type: "number" },
    available_facings: { type: "multi", values: FACINGS },
    price_per_sq_yard: { type: "number" },
    approval_type: { type: "enum", values: APPROVAL_TYPES },
    rera_status: { type: "enum", values: ["registered", "not_registered", "na"] },
    rera_number: { type: "text" },
    road_width_ft: { type: "number" },
    road_type: { type: "enum", values: ["bt", "cc", "gravel", "under_development"] },
    amenities: { type: "multi", values: ["water", "power", "drainage", "park", "security"] },
  },
  villa: {
    project_name: { type: "text" },
    villa_type: { type: "enum", values: ["independent", "gated_community", "duplex", "triplex"], required: true },
    construction_status: { type: "enum", values: ["ready_to_move", "under_construction", "resale"] },
    plot_area_sq_yards: { type: "number" },
    built_up_area_sqft: { type: "number" },
    bedrooms: { type: "int" },
    bathrooms: { type: "int" },
    floors: { type: "int" },
    facing: { type: "enum", values: FACINGS },
    asking_price: { type: "number" },
    negotiable: { type: "bool" },
    approval_type: { type: "enum", values: APPROVAL_TYPES },
    rera_number: { type: "text" },
    road_width_ft: { type: "number" },
    parking: { type: "enum", values: ["one_car", "two_plus_cars", "none"] },
    amenities: { type: "multi", values: ["water", "power", "security", "garden", "pool"] },
  },
};

const CONTACT_TYPES = {
  home: ["owner", "agent", "builder_developer"],
  plot: ["owner", "agent", "developer"],
  venture: ["developer", "owner", "marketing_agent"],
  villa: ["owner", "agent", "developer"],
};

const MEDIA_KINDS = {
  home: ["photo", "video", "floor_plan"],
  plot: ["photo", "video", "layout_map"],
  venture: ["photo", "layout_map", "video"],
  villa: ["photo", "video", "floor_plan"],
};

/* =====================================================
   VALIDATION HELPERS
===================================================== */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

const isBlank = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

const toBool = (v) => v === true || v === "true" || v === 1 || v === "1" || v === "yes";

const coerceField = (key, spec, raw) => {
  if (isBlank(raw)) return undefined;

  switch (spec.type) {
    case "text":
      return String(raw).trim();
    case "bool":
      return toBool(raw);
    case "number":
    case "int": {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${key} must be a non-negative number`);
      if (spec.type === "int" && !Number.isInteger(n)) throw new ValidationError(`${key} must be a whole number`);
      return n;
    }
    case "enum": {
      const v = String(raw);
      if (!spec.values.includes(v)) throw new ValidationError(`${key} must be one of: ${spec.values.join(", ")}`);
      return v;
    }
    case "multi": {
      const list = Array.isArray(raw) ? raw : String(raw).split(",");
      const cleaned = [...new Set(list.map((v) => String(v).trim()).filter(Boolean))];
      const bad = cleaned.filter((v) => !spec.values.includes(v));
      if (bad.length) throw new ValidationError(`${key} has invalid values: ${bad.join(", ")}`);
      return cleaned;
    }
    default:
      return undefined;
  }
};

const normalizeDetails = (type, input = {}) => {
  const schema = DETAIL_SCHEMAS[type];
  const out = {};

  for (const [key, spec] of Object.entries(schema)) {
    const value = coerceField(key, spec, input[key]);
    if (value === undefined) {
      if (spec.required) throw new ValidationError(`${key} is required`);
      continue;
    }
    out[key] = value;
  }

  // Cross-field rules
  if (type === "home") {
    if (out.property_type !== "other") delete out.property_type_other;
    if (out.plot_area_not_applicable) delete out.plot_area_sq_yards;
    if (out.property_status !== "resale") delete out.property_age_years;
    if (out.property_floor !== undefined && out.total_floors !== undefined && out.property_floor > out.total_floors) {
      throw new ValidationError("property_floor cannot exceed total_floors");
    }
  }

  if (type === "plot") {
    if (out.total_price_auto) {
      if (out.plot_size_sq_yards === undefined || out.price_per_sq_yard === undefined) {
        throw new ValidationError("plot_size_sq_yards and price_per_sq_yard are required to auto-calculate total_price");
      }
      out.total_price = Math.round(out.plot_size_sq_yards * out.price_per_sq_yard);
    }
  }

  if (type === "venture") {
    if (out.area_guntas !== undefined && out.area_guntas >= 40) {
      throw new ValidationError("area_guntas must be less than 40 (40 guntas = 1 acre)");
    }
    if (out.available_plots !== undefined && out.total_plots !== undefined && out.available_plots > out.total_plots) {
      throw new ValidationError("available_plots cannot exceed total_plots");
    }
    if (
      out.plot_size_min_sq_yards !== undefined &&
      out.plot_size_max_sq_yards !== undefined &&
      out.plot_size_min_sq_yards > out.plot_size_max_sq_yards
    ) {
      throw new ValidationError("plot_size_min_sq_yards cannot exceed plot_size_max_sq_yards");
    }
    if (out.rera_status !== "registered") delete out.rera_number;
  }

  return out;
};

/** Accept 10-digit Indian mobiles, optionally prefixed with +91 / 91 / 0. */
const normalizePhone = (raw, label) => {
  const digits = String(raw || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  if (!/^[6-9]\d{9}$/.test(local)) throw new ValidationError(`${label} must be a valid 10-digit mobile number`);
  return local;
};

const normalizeMedia = (type, media) => {
  if (media === undefined || media === null) return [];
  if (!Array.isArray(media)) throw new ValidationError("media must be an array");
  return media
    .filter((m) => m && !isBlank(m.url))
    .map((m) => {
      if (!MEDIA_KINDS[type].includes(m.kind)) {
        throw new ValidationError(`media kind must be one of: ${MEDIA_KINDS[type].join(", ")}`);
      }
      return { kind: m.kind, url: String(m.url).trim(), name: m.name ? String(m.name) : undefined };
    });
};

/** Pull "lat,lng" out of a pasted Google Maps link or a bare coordinate pair. */
export const parseCoordinates = (text) => {
  if (isBlank(text)) return null;
  const patterns = [
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, // .../@17.385,78.486,15z
    /[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, // ?q=17.385,78.486
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, // place data params
    /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, // "17.385, 78.486"
  ];
  for (const re of patterns) {
    const m = String(text).match(re);
    if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
  }
  return null;
};

const normalizeGps = (data) => {
  let latitude = isBlank(data.latitude) ? null : Number(data.latitude);
  let longitude = isBlank(data.longitude) ? null : Number(data.longitude);
  const maps_link = isBlank(data.maps_link) ? null : String(data.maps_link).trim();

  if ((latitude === null || longitude === null) && maps_link) {
    const parsed = parseCoordinates(maps_link);
    if (parsed) ({ latitude, longitude } = parsed);
  }

  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    throw new ValidationError("latitude must be between -90 and 90");
  }
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    throw new ValidationError("longitude must be between -180 and 180");
  }
  return { latitude, longitude, maps_link };
};

const toIdOrNull = (v) => {
  if (isBlank(v)) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError("location ids must be positive integers");
  return n;
};

/** Resolve state/district/town ids to names so lists can show them without joins. */
const resolveLocation = async (data) => {
  const state_id = toIdOrNull(data.state_id);
  const district_id = toIdOrNull(data.district_id);
  const town_id = toIdOrNull(data.town_id);

  const [state, district, town] = await Promise.all([
    state_id ? State.findByPk(state_id) : null,
    district_id ? District.findByPk(district_id) : null,
    town_id ? Town.findByPk(town_id) : null,
  ]);

  if (state_id && !state) throw new ValidationError("State not found");
  if (district_id && !district) throw new ValidationError("District not found");
  if (town_id && !town) throw new ValidationError("Town not found");
  if (district && state && String(district.state_id) !== String(state.id)) {
    throw new ValidationError("District does not belong to the selected state");
  }
  if (town && district && String(town.district_id) !== String(district.id)) {
    throw new ValidationError("Town does not belong to the selected district");
  }

  if (!state_id && isBlank(data.state_name)) throw new ValidationError("State is required");

  return {
    state_id,
    district_id,
    town_id,
    state_name: state?.name || (isBlank(data.state_name) ? null : String(data.state_name).trim()),
    district_name: district?.name || (isBlank(data.district_name) ? null : String(data.district_name).trim()),
    town_name: town?.name || null,
    town_area: isBlank(data.town_area) ? null : String(data.town_area).trim(),
  };
};

/** Validate and normalise a full create/update payload into model attributes. */
const buildAttributes = async (type, data) => {
  if (!LISTING_TYPES.includes(type)) {
    throw new ValidationError(`listing_type must be one of: ${LISTING_TYPES.join(", ")}`);
  }

  if (isBlank(data.contact_name)) throw new ValidationError("contact_name is required");
  if (!CONTACT_TYPES[type].includes(data.contact_type)) {
    throw new ValidationError(`contact_type must be one of: ${CONTACT_TYPES[type].join(", ")}`);
  }

  const mobile = normalizePhone(data.mobile, "mobile");
  const whatsappSame = data.whatsapp_same_as_mobile === undefined ? true : toBool(data.whatsapp_same_as_mobile);
  const whatsapp_number = whatsappSame ? mobile : normalizePhone(data.whatsapp_number, "whatsapp_number");

  const isDirect = data.is_direct_listing === undefined ? true : toBool(data.is_direct_listing);
  if (!isDirect && isBlank(data.agent_code)) {
    throw new ValidationError("agent_code is required when the listing is not direct");
  }

  return {
    listing_type: type,
    ...(await resolveLocation(data)),
    details: normalizeDetails(type, data.details || {}),
    ...normalizeGps(data),
    media: normalizeMedia(type, data.media),
    contact_name: String(data.contact_name).trim(),
    mobile,
    whatsapp_same_as_mobile: whatsappSame,
    whatsapp_number,
    contact_type: data.contact_type,
    is_direct_listing: isDirect,
    agent_code: isDirect ? null : String(data.agent_code).trim(),
  };
};

/* =====================================================
   CRUD
===================================================== */

export const createListing = async (data, employeeId) => {
  const attrs = await buildAttributes(data.listing_type, data);
  return PropertyListing.create({ ...attrs, status: "pending", created_by: employeeId || null });
};

export const getListings = async ({ type, status, search, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (type) {
    if (!LISTING_TYPES.includes(type)) throw new ValidationError("Invalid listing type");
    where.listing_type = type;
  }
  if (status) {
    if (!LISTING_STATUSES.includes(status)) throw new ValidationError("Invalid status");
    where.status = status;
  }
  if (!isBlank(search)) {
    const like = `%${String(search).trim()}%`;
    where[Op.or] = [
      { contact_name: { [Op.iLike]: like } },
      { mobile: { [Op.iLike]: like } },
      { town_name: { [Op.iLike]: like } },
      { town_area: { [Op.iLike]: like } },
      { district_name: { [Op.iLike]: like } },
      { agent_code: { [Op.iLike]: like } },
      { "details.venture_name": { [Op.iLike]: like } },
      { "details.project_name": { [Op.iLike]: like } },
      { "details.plot_number": { [Op.iLike]: like } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const { rows, count } = await PropertyListing.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: pageSize,
    offset: (pageNum - 1) * pageSize,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  };
};

export const getListingCounts = async () => {
  const rows = await PropertyListing.findAll({
    attributes: [
      "listing_type",
      "status",
      [PropertyListing.sequelize.fn("COUNT", PropertyListing.sequelize.col("id")), "count"],
    ],
    group: ["listing_type", "status"],
    raw: true,
  });

  const counts = {};
  for (const t of LISTING_TYPES) counts[t] = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) {
    const n = Number(r.count) || 0;
    counts[r.listing_type][r.status] = n;
    counts[r.listing_type].total += n;
  }
  return counts;
};

const findOrFail = async (id) => {
  const listing = await PropertyListing.findByPk(id);
  if (!listing) {
    const err = new Error("Listing not found");
    err.status = 404;
    throw err;
  }
  return listing;
};

export const getListingById = (id) => findOrFail(id);

/**
 * Full replace of the listing's editable fields. The type cannot change —
 * the details schema depends on it. Editing an approved/rejected listing
 * sends it back to pending, since the verified claims may have changed.
 */
export const updateListing = async (id, data, employeeId) => {
  const listing = await findOrFail(id);
  const attrs = await buildAttributes(listing.listing_type, data);
  await listing.update({ ...attrs, status: "pending", remarks: null, updated_by: employeeId || null });
  return listing;
};

export const updateListingStatus = async (id, { status, remarks }, employeeId) => {
  if (!LISTING_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${LISTING_STATUSES.join(", ")}`);
  }
  if (status === "rejected" && isBlank(remarks)) {
    throw new ValidationError("remarks are required when rejecting a listing");
  }
  const listing = await findOrFail(id);
  await listing.update({ status, remarks: isBlank(remarks) ? null : String(remarks).trim(), updated_by: employeeId || null });
  return listing;
};

export const deleteListing = async (id) => {
  const listing = await findOrFail(id);
  await listing.destroy();
};
