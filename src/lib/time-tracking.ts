import { getSupabaseServerClient } from "@/lib/supabase-server";

export type TimeEntryStatus = "draft" | "submitted" | "approved" | "rejected" | "corrected";
export type TimeEntryType = "work_time" | "client_visit" | "tour_time" | "break" | "admin_time" | "other";
export type TimeEntrySource = "manual" | "tour_wizard" | "system";
export type TimeOption = { id: string; name: string };
export type TimeRefOption = { id: string; name: string };

export type TimeEntry = {
  id: string; company_id: string; employee_id: string; location_id: string | null; client_id: string | null; tour_id: string | null; tour_stop_id: string | null; shift_id: string | null;
  entry_date: string; start_time: string; end_time: string; break_minutes: number; duration_minutes: number; entry_type: TimeEntryType; status: TimeEntryStatus; source: TimeEntrySource; notes: string | null;
  reviewed_by: string | null; reviewed_at: string | null; created_by: string | null; updated_at: string;
  employee_name: string | null; location_name: string | null; client_name: string | null; tour_name: string | null; tour_stop_name: string | null; shift_name: string | null; reviewed_by_name: string | null; created_by_name: string | null;
};

export type TimeTrackingData = {
  entries: TimeEntry[];
  employees: TimeOption[];
  locations: TimeOption[];
  clients: TimeOption[];
  tours: TimeRefOption[];
  tourStops: TimeRefOption[];
  shifts: TimeRefOption[];
  today: string;
  stats: { todayMinutes: number; weekMinutes: number; monthMinutes: number; open: number; approved: number; rejected: number; corrected: number; withoutEmployee: number };
  proofRows: Array<{ employeeId: string; employeeName: string; total: number; work: number; visits: number; breaks: number; admin: number; open: number; approved: number }>;
};

function companyId() { return process.env.NURIA_DEV_COMPANY_ID ?? null; }
function dkey(d: Date) { return d.toISOString().slice(0, 10); }
function week(d: Date) { const day = d.getDay() || 7; const s = new Date(d); s.setDate(d.getDate() - day + 1); const e = new Date(s); e.setDate(s.getDate() + 6); return { s: dkey(s), e: dkey(e) }; }

export async function getTimeTrackingData(): Promise<TimeTrackingData> {
  const supabase = getSupabaseServerClient(); const cid = companyId(); const now = new Date(); const today = dkey(now); const w = week(now); const mStart = dkey(new Date(now.getFullYear(), now.getMonth(), 1)); const mEnd = dkey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const empty = { todayMinutes: 0, weekMinutes: 0, monthMinutes: 0, open: 0, approved: 0, rejected: 0, corrected: 0, withoutEmployee: 0 };
  if (!supabase || !cid) return { entries: [], employees: [], locations: [], clients: [], tours: [], tourStops: [], shifts: [], today, stats: empty, proofRows: [] };
  const [{ data: entries }, { data: employees }, { data: locations }, { data: clients }, { data: tours }, { data: stops }, { data: shifts }] = await Promise.all([
    supabase.from("time_entries").select("*").eq("company_id", cid).order("entry_date", { ascending: false }).order("start_time", { ascending: true }),
    supabase.from("profiles").select("id, first_name, last_name").eq("company_id", cid).neq("role", "admin").order("last_name"),
    supabase.from("company_locations").select("id, name").eq("company_id", cid).order("name"),
    supabase.from("clients").select("id, first_name, last_name").eq("company_id", cid).order("last_name"),
    supabase.from("tours").select("id, title").eq("company_id", cid).order("tour_date", { ascending: false }),
    supabase.from("tour_stops").select("id, tour_id, client_id").eq("company_id", cid),
    supabase.from("shifts").select("id, title").eq("company_id", cid).order("date", { ascending: false }),
  ]);
  const employeesOpt = (employees ?? []).map((x) => ({ id: x.id, name: [x.first_name, x.last_name].filter(Boolean).join(" ") || "Ohne Namen" }));
  const clientsOpt = (clients ?? []).map((x) => ({ id: x.id, name: [x.first_name, x.last_name].filter(Boolean).join(" ") || "Ohne Namen" }));
  const locOpt = (locations ?? []) as TimeOption[]; const tourOpt = (tours ?? []).map((x) => ({ id: x.id, name: x.title })) as TimeRefOption[]; const shiftOpt = (shifts ?? []).map((x) => ({ id: x.id, name: x.title })) as TimeRefOption[];
  const em = new Map(employeesOpt.map((x) => [x.id, x.name])); const cm = new Map(clientsOpt.map((x) => [x.id, x.name])); const lm = new Map(locOpt.map((x) => [x.id, x.name])); const tm = new Map(tourOpt.map((x) => [x.id, x.name])); const sm = new Map(shiftOpt.map((x) => [x.id, x.name]));
  const stopOpt = (stops ?? []).map((x) => ({ id: x.id, name: cm.get(x.client_id ?? "") ?? "Tourstopp" }));
  const stopm = new Map(stopOpt.map((x) => [x.id, x.name]));
  const normalized = ((entries ?? []) as Omit<TimeEntry, "employee_name" | "location_name" | "client_name" | "tour_name" | "tour_stop_name" | "shift_name" | "reviewed_by_name" | "created_by_name">[]).map((e) => ({ ...e, employee_name: em.get(e.employee_id) ?? null, location_name: e.location_id ? lm.get(e.location_id) ?? null : null, client_name: e.client_id ? cm.get(e.client_id) ?? null : null, tour_name: e.tour_id ? tm.get(e.tour_id) ?? null : null, tour_stop_name: e.tour_stop_id ? stopm.get(e.tour_stop_id) ?? null : null, shift_name: e.shift_id ? sm.get(e.shift_id) ?? null : null, reviewed_by_name: e.reviewed_by ? em.get(e.reviewed_by) ?? null : null, created_by_name: e.created_by ? em.get(e.created_by) ?? null : null }));
  const sum = (rows: TimeEntry[]) => rows.reduce((a, e) => a + (e.duration_minutes ?? 0), 0);
  const proofRows = employeesOpt.map((employee) => { const rows = normalized.filter((e) => e.employee_id === employee.id); return { employeeId: employee.id, employeeName: employee.name, total: sum(rows), work: sum(rows.filter((e) => e.entry_type === "work_time")), visits: sum(rows.filter((e) => e.entry_type === "client_visit")), breaks: sum(rows.filter((e) => e.entry_type === "break")), admin: sum(rows.filter((e) => e.entry_type === "admin_time")), open: rows.filter((e) => e.status === "draft" || e.status === "submitted").length, approved: rows.filter((e) => e.status === "approved").length }; });
  return { entries: normalized, employees: employeesOpt, locations: locOpt, clients: clientsOpt, tours: tourOpt, tourStops: stopOpt, shifts: shiftOpt, today, stats: { todayMinutes: sum(normalized.filter((e) => e.entry_date === today)), weekMinutes: sum(normalized.filter((e) => e.entry_date >= w.s && e.entry_date <= w.e)), monthMinutes: sum(normalized.filter((e) => e.entry_date >= mStart && e.entry_date <= mEnd)), open: normalized.filter((e) => e.status === "draft" || e.status === "submitted").length, approved: normalized.filter((e) => e.status === "approved").length, rejected: normalized.filter((e) => e.status === "rejected").length, corrected: normalized.filter((e) => e.status === "corrected").length, withoutEmployee: normalized.filter((e) => !e.employee_id).length }, proofRows };
}
