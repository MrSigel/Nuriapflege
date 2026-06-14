import { getSupabaseServerClient } from "@/lib/supabase-server";

export type EmployeeRole = "inhaber" | "pdl" | "verwaltung" | "mitarbeiter" | "pflegefachkraft";
export type EmployeeStatus = "active" | "inactive" | "invited" | "pending";
export type InvitationStatus = "not_invited" | "invited" | "accepted" | "expired";

export type EmployeeLocationOption = {
  id: string;
  name: string;
};

export type Employee = {
  id: string;
  company_id: string;
  role: EmployeeRole;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  staff_code: string | null;
  job_title: string | null;
  qualification: string | null;
  status: EmployeeStatus;
  invitation_status: InvitationStatus;
  invited_at: string | null;
  accepted_at: string | null;
  updated_at: string;
  locations: EmployeeLocationOption[];
};

export type EmployeesData = {
  employees: Employee[];
  locations: EmployeeLocationOption[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    openInvitations: number;
    pdl: number;
    administration: number;
    careStaff: number;
  };
};

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

export async function getEmployeesData(): Promise<EmployeesData> {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const emptyStats = { total: 0, active: 0, inactive: 0, openInvitations: 0, pdl: 0, administration: 0, careStaff: 0 };

  if (!supabase || !companyId) {
    return { employees: [], locations: [], stats: emptyStats };
  }

  const [{ data: profiles }, { data: locations }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, company_id, role, first_name, last_name, email, phone, staff_code, job_title, qualification, status, invitation_status, invited_at, accepted_at, updated_at",
      )
      .eq("company_id", companyId)
      .neq("role", "admin")
      .order("last_name", { ascending: true }),
    supabase.from("company_locations").select("id, name").eq("company_id", companyId).order("name", { ascending: true }),
    supabase.from("employee_locations").select("employee_id, location:company_locations(id, name)").eq("company_id", companyId),
  ]);

  const locationOptions = (locations ?? []) as EmployeeLocationOption[];
  const locationMap = new Map<string, EmployeeLocationOption[]>();

  for (const assignment of assignments ?? []) {
    const location = Array.isArray(assignment.location) ? assignment.location[0] : assignment.location;

    if (!location) {
      continue;
    }

    const current = locationMap.get(assignment.employee_id) ?? [];
    current.push({ id: location.id, name: location.name });
    locationMap.set(assignment.employee_id, current);
  }

  const employees = ((profiles ?? []) as Omit<Employee, "locations">[]).map((employee) => ({
    ...employee,
    locations: locationMap.get(employee.id) ?? [],
  }));

  return {
    employees,
    locations: locationOptions,
    stats: {
      total: employees.length,
      active: employees.filter((employee) => employee.status === "active").length,
      inactive: employees.filter((employee) => employee.status === "inactive").length,
      openInvitations: employees.filter((employee) => employee.invitation_status === "invited").length,
      pdl: employees.filter((employee) => employee.role === "pdl").length,
      administration: employees.filter((employee) => employee.role === "verwaltung").length,
      careStaff: employees.filter((employee) => employee.role === "mitarbeiter" || employee.role === "pflegefachkraft").length,
    },
  };
}
