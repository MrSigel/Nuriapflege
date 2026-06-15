import { getSupabaseServerClient } from "@/lib/supabase-server";

export type TourStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type TourStopStatus = "planned" | "in_progress" | "completed" | "skipped" | "cancelled";
export type TourOption = { id: string; name: string };
export type ShiftOption = { id: string; title: string; date: string };

export type TourStop = {
  id: string;
  tour_id: string;
  client_id: string | null;
  shift_id: string | null;
  sort_order: number;
  suggested_time: string | null;
  tasks: string | null;
  notes: string | null;
  status: TourStopStatus;
  client_name: string | null;
  shift_title: string | null;
};

export type TourRecord = {
  id: string;
  company_id: string;
  location_id: string | null;
  employee_id: string | null;
  title: string;
  tour_date: string;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  status: TourStatus;
  notes: string | null;
  created_by: string | null;
  updated_at: string;
  employee_name: string | null;
  location_name: string | null;
  created_by_name: string | null;
  stops: TourStop[];
};

export type ToursData = {
  tours: TourRecord[];
  employees: TourOption[];
  clients: TourOption[];
  locations: TourOption[];
  shifts: ShiftOption[];
  today: string;
  stats: {
    today: number;
    week: number;
    planned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    withoutEmployee: number;
    openStops: number;
  };
};

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

function key(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekRange(today: Date) {
  const day = today.getDay() || 7;
  const start = new Date(today);
  start.setDate(today.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: key(start), end: key(end) };
}

export async function getToursData(): Promise<ToursData> {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const now = new Date();
  const today = key(now);
  const week = weekRange(now);
  const empty = { today: 0, week: 0, planned: 0, inProgress: 0, completed: 0, cancelled: 0, withoutEmployee: 0, openStops: 0 };

  if (!supabase || !companyId) return { tours: [], employees: [], clients: [], locations: [], shifts: [], today, stats: empty };

  const [{ data: tours }, { data: stops }, { data: employees }, { data: clients }, { data: locations }, { data: shifts }] = await Promise.all([
    supabase.from("tours").select("id, company_id, location_id, employee_id, title, tour_date, suggested_start_time, suggested_end_time, status, notes, created_by, updated_at").eq("company_id", companyId).order("tour_date", { ascending: true }),
    supabase.from("tour_stops").select("id, tour_id, client_id, shift_id, sort_order, suggested_time, tasks, notes, status").eq("company_id", companyId).order("sort_order", { ascending: true }),
    supabase.from("profiles").select("id, first_name, last_name").eq("company_id", companyId).neq("role", "admin").order("last_name", { ascending: true }),
    supabase.from("clients").select("id, first_name, last_name").eq("company_id", companyId).order("last_name", { ascending: true }),
    supabase.from("company_locations").select("id, name").eq("company_id", companyId).order("name", { ascending: true }),
    supabase.from("shifts").select("id, title, date").eq("company_id", companyId).order("date", { ascending: false }),
  ]);

  const employeeOptions = (employees ?? []).map((item) => ({ id: item.id, name: [item.first_name, item.last_name].filter(Boolean).join(" ") || "Ohne Namen" }));
  const clientOptions = (clients ?? []).map((item) => ({ id: item.id, name: [item.first_name, item.last_name].filter(Boolean).join(" ") || "Ohne Namen" }));
  const locationOptions = (locations ?? []) as TourOption[];
  const shiftOptions = (shifts ?? []) as ShiftOption[];
  const employeeMap = new Map(employeeOptions.map((item) => [item.id, item.name]));
  const clientMap = new Map(clientOptions.map((item) => [item.id, item.name]));
  const locationMap = new Map(locationOptions.map((item) => [item.id, item.name]));
  const shiftMap = new Map(shiftOptions.map((item) => [item.id, item.title]));
  const stopMap = new Map<string, TourStop[]>();

  for (const stop of stops ?? []) {
    const normalized = { ...stop, client_name: stop.client_id ? clientMap.get(stop.client_id) ?? null : null, shift_title: stop.shift_id ? shiftMap.get(stop.shift_id) ?? null : null } as TourStop;
    stopMap.set(stop.tour_id, [...(stopMap.get(stop.tour_id) ?? []), normalized]);
  }

  const normalizedTours = ((tours ?? []) as Omit<TourRecord, "employee_name" | "location_name" | "created_by_name" | "stops">[]).map((tour) => ({
    ...tour,
    employee_name: tour.employee_id ? employeeMap.get(tour.employee_id) ?? null : null,
    location_name: tour.location_id ? locationMap.get(tour.location_id) ?? null : null,
    created_by_name: tour.created_by ? employeeMap.get(tour.created_by) ?? null : null,
    stops: stopMap.get(tour.id) ?? [],
  }));

  return {
    tours: normalizedTours,
    employees: employeeOptions,
    clients: clientOptions,
    locations: locationOptions,
    shifts: shiftOptions,
    today,
    stats: {
      today: normalizedTours.filter((tour) => tour.tour_date === today).length,
      week: normalizedTours.filter((tour) => tour.tour_date >= week.start && tour.tour_date <= week.end).length,
      planned: normalizedTours.filter((tour) => tour.status === "planned").length,
      inProgress: normalizedTours.filter((tour) => tour.status === "in_progress").length,
      completed: normalizedTours.filter((tour) => tour.status === "completed").length,
      cancelled: normalizedTours.filter((tour) => tour.status === "cancelled").length,
      withoutEmployee: normalizedTours.filter((tour) => !tour.employee_id).length,
      openStops: normalizedTours.reduce((sum, tour) => sum + tour.stops.filter((stop) => stop.status === "planned" || stop.status === "in_progress").length, 0),
    },
  };
}
