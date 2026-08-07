import Permission from "../model/permissionModel.js";
import RolePermission from "../model/rolePermissionModel.js";
import EmployeePermission from "../model/employeePermissionModel.js";
import Access from "../model/accessModel.js";
import Employee from "../model/employeeModel.js";

const CATALOG_SEED = [
  { key: "add_land", label: "Add Land", path: "/add/land", sort_order: 1 },
  { key: "location", label: "Location", path: "/location", sort_order: 2 },
  { key: "employees", label: "Employees", path: "/employees", sort_order: 3 },
  { key: "call_verification", label: "Call Verification", path: "/call/verification", sort_order: 4 },
  { key: "physical_verification", label: "Physical Verification", path: "/physical/verification", sort_order: 5 },
  { key: "final_verification", label: "Final Verification", path: "/final/verification", sort_order: 6 },
];

/** Fallback field roles if `access` table has no field mappings yet. */
const DEFAULT_FIELD_ROLE_NAMES = [
  "field executive",
  "field_executive",
  "field agent",
  "field_agent",
  "agent",
  "manager",
  "executive",
];

/** Permissions every field-app role should have for the mobile admin app. */
const DEFAULT_FIELD_PERMISSION_KEYS = ["add_land", "location", "physical_verification"];

export const isAdmin = (roleName) => {
  return typeof roleName === "string" && roleName.trim().toLowerCase() === "admin";
};

const normalizeRole = (roleName) =>
  typeof roleName === "string" ? roleName.trim().toLowerCase() : "";

/**
 * Ensure permission catalog exists, then grant field roles `add_land` (and other
 * field defaults) when those role→permission links are missing.
 *
 * This fixes 403 "You do not have permission to perform this action." on
 * POST /api/land for employees who can open the field app but whose role was
 * never assigned `add_land` in `role_permissions`.
 */
export const ensureSeeded = async () => {
  for (const item of CATALOG_SEED) {
    await Permission.findOrCreate({
      where: { key: item.key },
      defaults: item,
    });
  }

  await ensureDefaultFieldRolePermissions();
};

const ensureDefaultFieldRolePermissions = async () => {
  const permissions = await Permission.findAll({
    where: { key: DEFAULT_FIELD_PERMISSION_KEYS },
  });
  if (!permissions.length) return;

  const permissionByKey = new Map(permissions.map((p) => [p.key, p]));

  const roleNames = new Set(DEFAULT_FIELD_ROLE_NAMES.map(normalizeRole));

  try {
    const fieldAccessRows = await Access.findAll({ where: { app_type: "field" } });
    for (const row of fieldAccessRows) {
      const n = normalizeRole(row.role);
      if (n) roleNames.add(n);
    }
  } catch (_) {
    // access table may be empty / unavailable during early boot
  }

  try {
    const employees = await Employee.findAll({ attributes: ["role"], raw: true });
    for (const row of employees) {
      const n = normalizeRole(row.role);
      if (n && n !== "admin") roleNames.add(n);
    }
  } catch (_) {
    // ignore
  }

  const allRolePerms = await RolePermission.findAll();
  /** @type {Map<string, { canonical: string, permissionIds: Set<number> }>} */
  const existingByRole = new Map();
  for (const row of allRolePerms) {
    const n = normalizeRole(row.role_name);
    if (!existingByRole.has(n)) {
      existingByRole.set(n, {
        canonical: row.role_name,
        permissionIds: new Set(),
      });
    }
    existingByRole.get(n).permissionIds.add(row.permission_id);
  }

  const toCreate = [];
  for (const roleNorm of roleNames) {
    if (!roleNorm || roleNorm === "admin") continue;

    let entry = existingByRole.get(roleNorm);
    if (!entry) {
      entry = { canonical: roleNorm, permissionIds: new Set() };
      existingByRole.set(roleNorm, entry);
    }

    for (const key of DEFAULT_FIELD_PERMISSION_KEYS) {
      const perm = permissionByKey.get(key);
      if (!perm) continue;
      if (entry.permissionIds.has(perm.id)) continue;
      toCreate.push({
        role_name: entry.canonical,
        permission_id: perm.id,
      });
      entry.permissionIds.add(perm.id);
    }
  }

  if (toCreate.length) {
    await RolePermission.bulkCreate(toCreate, { ignoreDuplicates: true });
    console.log(
      `Seeded ${toCreate.length} missing field role permission(s) (incl. add_land)`
    );
  }
};

export const getCatalog = async () => {
  return await Permission.findAll({ order: [["sort_order", "ASC"]] });
};

const keysByIds = async (ids) => {
  if (!ids.length) return [];
  const permissions = await Permission.findAll({ where: { id: ids } });
  return permissions.map((p) => p.key);
};

/** Match role_permissions rows ignoring case/whitespace on role_name. */
const rolePermissionIdsForRole = async (roleName) => {
  const normalized = normalizeRole(roleName);
  if (!normalized) return [];

  const roleRows = await RolePermission.findAll();
  return roleRows
    .filter((row) => normalizeRole(row.role_name) === normalized)
    .map((row) => row.permission_id);
};

export const getEffectivePermissions = async (employeeId, roleName) => {
  if (isAdmin(roleName)) {
    return { isAdmin: true, keys: [] };
  }

  const catalog = await Permission.findAll();
  const catalogById = new Map(catalog.map((p) => [p.id, p.key]));

  const permissionIds = await rolePermissionIdsForRole(roleName);
  const allowed = new Set(
    permissionIds.map((id) => catalogById.get(id)).filter(Boolean)
  );

  const overrideRows = await EmployeePermission.findAll({
    where: { employee_id: employeeId },
  });
  for (const row of overrideRows) {
    const key = catalogById.get(row.permission_id);
    if (!key) continue;
    if (row.type === "ALLOW") allowed.add(key);
    else allowed.delete(key);
  }

  return { isAdmin: false, keys: [...allowed] };
};

export const getRolePermissions = async (roleName) => {
  const ids = await rolePermissionIdsForRole(roleName);
  return keysByIds(ids);
};

export const setRolePermissions = async (roleName, permissionKeys) => {
  const permissions = await Permission.findAll({ where: { key: permissionKeys } });
  const foundKeys = new Set(permissions.map((p) => p.key));
  const invalid = permissionKeys.filter((k) => !foundKeys.has(k));
  if (invalid.length) throw new Error(`Unknown permission key(s): ${invalid.join(", ")}`);

  // Remove all case-variants of this role name, then write canonical name.
  const allRows = await RolePermission.findAll();
  const normalized = normalizeRole(roleName);
  const idsToDelete = allRows
    .filter((r) => normalizeRole(r.role_name) === normalized)
    .map((r) => r.id);
  if (idsToDelete.length) {
    await RolePermission.destroy({ where: { id: idsToDelete } });
  }

  if (permissions.length) {
    await RolePermission.bulkCreate(
      permissions.map((p) => ({ role_name: roleName, permission_id: p.id }))
    );
  }

  return keysByIds(permissions.map((p) => p.id));
};

export const getEmployeePermissions = async (employeeId, roleName) => {
  const effective = await getEffectivePermissions(employeeId, roleName);

  const catalog = await Permission.findAll();
  const catalogById = new Map(catalog.map((p) => [p.id, p.key]));
  const overrideRows = await EmployeePermission.findAll({
    where: { employee_id: employeeId },
  });
  const overrides = overrideRows
    .map((row) => ({
      permissionKey: catalogById.get(row.permission_id),
      type: row.type,
    }))
    .filter((o) => o.permissionKey);

  return { ...effective, overrides };
};

export const setEmployeeOverrides = async (employeeId, overrides, roleName) => {
  const keys = overrides.map((o) => o.permissionKey);
  const permissions = await Permission.findAll({ where: { key: keys } });
  const permissionByKey = new Map(permissions.map((p) => [p.key, p]));
  const invalid = keys.filter((k) => !permissionByKey.has(k));
  if (invalid.length) throw new Error(`Unknown permission key(s): ${invalid.join(", ")}`);

  await EmployeePermission.destroy({ where: { employee_id: employeeId } });
  if (overrides.length) {
    await EmployeePermission.bulkCreate(
      overrides.map((o) => ({
        employee_id: employeeId,
        permission_id: permissionByKey.get(o.permissionKey).id,
        type: o.type,
      }))
    );
  }

  return getEmployeePermissions(employeeId, roleName);
};
