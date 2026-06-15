import type { Employee, EmployeeRole } from "@/lib/employees";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { managedRoles, permissions } from "@/lib/permissions-config";

export type RolePermissionData = {
  roles: Array<{ key: EmployeeRole; name: string; description: string; employeeCount: number; activePermissionCount: number }>;
  permissionsByCategory: Array<{ category: string; permissions: typeof permissions }>;
  enabled: Record<EmployeeRole, Record<string, boolean>>;
  employees: Employee[];
  stats: {
    rolesTotal: number;
    activeEmployees: number;
    pdlExtended: number;
    administrationSpecial: number;
    recentChanges: number;
  };
};

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

export async function getRolePermissionData(): Promise<RolePermissionData> {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const roleKeys = managedRoles.map((role) => role.key);
  const enabled = Object.fromEntries(
    roleKeys.map((role) => [
      role,
      Object.fromEntries(permissions.map((permission) => [permission.key, permission.defaultRoles.includes(role)])),
    ]),
  ) as Record<EmployeeRole, Record<string, boolean>>;

  if (!supabase || !companyId) {
    return buildData([], [], enabled);
  }

  await supabase.from("permissions").upsert(
    permissions.map((permission) => ({
      key: permission.key,
      name: permission.name,
      category: permission.category,
      description: null,
    })),
    { onConflict: "key" },
  );

  await supabase.from("roles").upsert(
    managedRoles.map((role) => ({
      company_id: companyId,
      key: role.key,
      name: role.name,
      description: role.description,
      is_system_role: true,
    })),
    { onConflict: "company_id,key" },
  );

  const [{ data: rolePermissions }, { data: employees }, { count: recentChanges }] = await Promise.all([
    supabase.from("role_permissions").select("role_key, permission_key, enabled").eq("company_id", companyId),
    supabase
      .from("profiles")
      .select("id, company_id, role, first_name, last_name, email, phone, staff_code, job_title, qualification, status, invitation_status, invited_at, accepted_at, updated_at")
      .eq("company_id", companyId)
      .neq("role", "admin"),
    supabase.from("permission_audit_logs").select("id", { count: "exact", head: true }).eq("company_id", companyId),
  ]);

  for (const row of rolePermissions ?? []) {
    const role = row.role_key as EmployeeRole;
    if (enabled[role]) enabled[role][row.permission_key] = Boolean(row.enabled);
  }

  return buildData((employees ?? []) as Employee[], [], enabled, recentChanges ?? 0);
}

function buildData(
  employees: Employee[],
  _unused: unknown[],
  enabled: Record<EmployeeRole, Record<string, boolean>>,
  recentChanges = 0,
): RolePermissionData {
  const permissionsByCategory = Array.from(new Set(permissions.map((permission) => permission.category))).map((category) => ({
    category,
    permissions: permissions.filter((permission) => permission.category === category),
  }));
  const roles = managedRoles.map((role) => ({
    ...role,
    employeeCount: employees.filter((employee) => employee.role === role.key).length,
    activePermissionCount: Object.values(enabled[role.key]).filter(Boolean).length,
  }));

  return {
    roles,
    permissionsByCategory,
    enabled,
    employees,
    stats: {
      rolesTotal: roles.length,
      activeEmployees: employees.filter((employee) => employee.status === "active").length,
      pdlExtended: Object.entries(enabled.pdl).filter(([key, value]) => value && !permissions.find((permission) => permission.key === key)?.defaultRoles.includes("pdl")).length,
      administrationSpecial: Object.entries(enabled.verwaltung).filter(([key, value]) => value && !permissions.find((permission) => permission.key === key)?.defaultRoles.includes("verwaltung")).length,
      recentChanges,
    },
  };
}
