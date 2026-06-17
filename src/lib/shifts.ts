import { getSupabaseServerClient } from "@/lib/supabase-server";
import { companyId as currentCompanyId } from "@/lib/onboarding";

export type ShiftStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type ShiftType = "pflegeeinsatz" | "hauswirtschaft" | "beratung" | "verwaltung" | "bereitschaft" | "sonstiges";

export type ShiftOption = { id: string; name: string };
export type ShiftEmployee = { id: string; name: string };
export type ShiftClient = { id: string; name: string };

export type ShiftRecord = {
  id: string;
  company_id: string;
  location_id: string | null;
  employee_id: string | null;
  client_id: string | null;
  title: string;
  date: string;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  status: ShiftStatus;
  shift_type: ShiftType;
  notes: string | null;
  created_by: string | null;
  updated_at: string;
  employee_name: string | null;
  client_name: string | null;
  location_name: string | null;
  created_by_name: string | null;
};

export type ShiftsData = {
  shifts: ShiftRecord[];
  employees: ShiftEmployee[];
  clients: ShiftClient[];
  locations: ShiftOption[];
  stats: {
    today: number;
    week: number;
    planned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    withoutEmployee: number;
    withoutClient: number;
  };
  today: string;
  exportPrepared: boolean;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekRange(today: Date) {
  const day = today.getDay() || 7;
  const start = new Date(today);
  start.setDate(today.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export async function getShiftsData(): Promise<ShiftsData> {
  const supabase = getSupabaseServerClient();
  const companyId = await currentCompanyId();
  const now = new Date();
  const today = toDateKey(now);
  const currentWeek = weekRange(now);

  if (!supabase || !companyId) {
    return {
      shifts: [],
      employees: [],
      clients: [],
      locations: [],
      stats: { today: 0, week: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0, withoutEmployee: 0, withoutClient: 0 },
      today,
      exportPrepared: false,
    };
  }

  const [{ data: shifts }, { data: employees }, { data: clients }, { data: locations }] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, company_id, location_id, employee_id, client_id, title, date, suggested_start_time, suggested_end_time, status, shift_type, notes, created_by, updated_at")
      .eq("company_id", companyId)
      .order("date", { ascending: true })
      .order("suggested_start_time", { ascending: true }),
    supabase.from("profiles").select("id, first_name, last_name").eq("company_id", companyId).neq("role", "admin").order("last_name", { ascending: true }),
    supabase.from("clients").select("id, first_name, last_name").eq("company_id", companyId).order("last_name", { ascending: true }),
    supabase.from("company_locations").select("id, name").eq("company_id", companyId).order("name", { ascending: true }),
  ]);

  const employeeOptions = (employees ?? []).map((employee) => ({ id: employee.id, name: [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Ohne Namen" }));
  const clientOptions = (clients ?? []).map((client) => ({ id: client.id, name: [client.first_name, client.last_name].filter(Boolean).join(" ") || "Ohne Namen" }));
  const locationOptions = (locations ?? []) as ShiftOption[];
  const employeeMap = new Map(employeeOptions.map((employee) => [employee.id, employee.name]));
  const clientMap = new Map(clientOptions.map((client) => [client.id, client.name]));
  const locationMap = new Map(locationOptions.map((location) => [location.id, location.name]));

  const normalized = ((shifts ?? []) as Omit<ShiftRecord, "employee_name" | "client_name" | "location_name" | "created_by_name">[]).map((shift) => ({
    ...shift,
    employee_name: shift.employee_id ? employeeMap.get(shift.employee_id) ?? null : null,
    client_name: shift.client_id ? clientMap.get(shift.client_id) ?? null : null,
    location_name: shift.location_id ? locationMap.get(shift.location_id) ?? null : null,
    created_by_name: shift.created_by ? employeeMap.get(shift.created_by) ?? null : null,
  }));

  return {
    shifts: normalized,
    employees: employeeOptions,
    clients: clientOptions,
    locations: locationOptions,
    stats: {
      today: normalized.filter((shift) => shift.date === today).length,
      week: normalized.filter((shift) => shift.date >= currentWeek.start && shift.date <= currentWeek.end).length,
      planned: normalized.filter((shift) => shift.status === "planned").length,
      inProgress: normalized.filter((shift) => shift.status === "in_progress").length,
      completed: normalized.filter((shift) => shift.status === "completed").length,
      cancelled: normalized.filter((shift) => shift.status === "cancelled").length,
      withoutEmployee: normalized.filter((shift) => !shift.employee_id).length,
      withoutClient: normalized.filter((shift) => !shift.client_id).length,
    },
    today,
    exportPrepared: false,
  };
}
