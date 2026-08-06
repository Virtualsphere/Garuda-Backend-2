import Permission from "../model/permissionModel.js";
import RolePermission from "../model/rolePermissionModel.js";
import EmployeePermission from "../model/employeePermissionModel.js";

const CATALOG_SEED = [
  { key: "add_land", label: "Add Land", path: "/add/land", sort_order: 1 },
  { key: "location", label: "Location", path: "/location", sort_order: 2 },
  { key: "employees", label: "Employees", path: "/employees", sort_order: 3 },
  { key: "call_verification", label: "Call Verification", path: "/call/verification", sort_order: 4 },
  { key: "physical_verification", label: "Physical Verification", path: "/physical/verification", sort_order: 5 },
  { key: "final_verification", label: "Final Verification", path: "/final/verification", sort_order: 6 },
];

export const isAdmin = (roleName) => {
  return typeof roleName === "string" && roleName.trim().toLowerCase() === "admin";
};

export const ensureSeeded = async () => {
  const count = await Permission.count();
  if (count > 0) return;
  await Permission.bulkCreate(CATALOG_SEED);
};

export const getCatalog = async () => {
  return await Permission.findAll({ order: [["sort_order", "ASC"]] });
};

const keysByIds = async (ids) => {
  if (!ids.length) return [];
  const permissions = await Permission.findAll({ where: { id: ids } });
  return permissions.map((p) => p.key);
};

export const getEffectivePermissions = async (employeeId, roleName) => {
  if (isAdmin(roleName)) {
    return { isAdmin: true, keys: [] };
  }

  const catalog = await Permission.findAll();
  const catalogById = new Map(catalog.map((p) => [p.id, p.key]));

  const roleRows = await RolePermission.findAll({ where: { role_name: roleName } });
  const allowed = new Set(
    roleRows.map((row) => catalogById.get(row.permission_id)).filter(Boolean)
  );

  const overrideRows = await EmployeePermission.findAll({ where: { employee_id: employeeId } });
  for (const row of overrideRows) {
    const key = catalogById.get(row.permission_id);
    if (!key) continue;
    if (row.type === "ALLOW") allowed.add(key);
    else allowed.delete(key);
  }

  return { isAdmin: false, keys: [...allowed] };
};

export const getRolePermissions = async (roleName) => {
  const rows = await RolePermission.findAll({ where: { role_name: roleName } });
  return keysByIds(rows.map((r) => r.permission_id));
};

export const setRolePermissions = async (roleName, permissionKeys) => {
  const permissions = await Permission.findAll({ where: { key: permissionKeys } });
  const foundKeys = new Set(permissions.map((p) => p.key));
  const invalid = permissionKeys.filter((k) => !foundKeys.has(k));
  if (invalid.length) throw new Error(`Unknown permission key(s): ${invalid.join(", ")}`);

  await RolePermission.destroy({ where: { role_name: roleName } });
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
  const overrideRows = await EmployeePermission.findAll({ where: { employee_id: employeeId } });
  const overrides = overrideRows
    .map((row) => ({ permissionKey: catalogById.get(row.permission_id), type: row.type }))
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
