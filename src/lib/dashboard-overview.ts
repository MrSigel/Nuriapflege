import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Role } from "@/lib/nuria-config";

type StatKey =
  | "clients_total"
  | "employees_total"
  | "today_shifts"
  | "today_tours"
  | "assigned_clients"
  | "open_tasks"
  | "open_documents"
  | "new_messages"
  | "open_billing"
  | "open_qm"
  | "open_applicants"
  | "open_website_leads"
  | "tracked_time_today";

export type OverviewStat = {
  key: StatKey;
  label: string;
  value: number;
};

export type QuickAction = {
  label: string;
  href: string;
};

export type OverviewMessage = {
  id: string;
  sender: string;
  roleOrCode: string;
  time: string;
  preview: string;
};

export type OverviewNews = {
  id: string;
  title: string;
  date: string;
  preview: string;
};

export type DashboardOverviewData = {
  stats: OverviewStat[];
  quickActions: QuickAction[];
  messages: OverviewMessage[];
  news: OverviewNews[];
};

type QueryContext = {
  role: Role;
  companyId: string | null;
  userId: string | null;
  today: string;
};

type SupabaseQuery = any;

const openStatuses = ["open", "pending", "planned", "missing"];
const employeeRoles = ["inhaber", "pdl", "verwaltung", "mitarbeiter"];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function preview(value: string, maxLength = 96) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function emptyCompanyStats(): OverviewStat[] {
  return [
    { key: "clients_total", label: "Klienten gesamt", value: 0 },
    { key: "employees_total", label: "Mitarbeiter gesamt", value: 0 },
    { key: "today_shifts", label: "Heutige Dienste", value: 0 },
    { key: "today_tours", label: "Heutige Touren", value: 0 },
    { key: "open_tasks", label: "Offene Aufgaben", value: 0 },
    { key: "open_documents", label: "Offene Dokumente", value: 0 },
    { key: "new_messages", label: "Neue Nachrichten", value: 0 },
    { key: "open_billing", label: "Offene Abrechnungen", value: 0 },
    { key: "open_qm", label: "Offene QM/MD-Punkte", value: 0 },
    { key: "open_applicants", label: "Offene Bewerbungen", value: 0 },
    { key: "open_website_leads", label: "Offene Website-Anfragen", value: 0 },
  ];
}

function emptyStaffStats(): OverviewStat[] {
  return [
    { key: "today_shifts", label: "Heutige Dienste", value: 0 },
    { key: "today_tours", label: "Heutige Tour", value: 0 },
    { key: "assigned_clients", label: "Zugewiesene Patienten", value: 0 },
    { key: "open_tasks", label: "Offene Notizen / Aufgaben", value: 0 },
    { key: "new_messages", label: "Neue Nachrichten", value: 0 },
    { key: "open_documents", label: "Offene Uploads", value: 0 },
    { key: "tracked_time_today", label: "Erfasste Zeit heute", value: 0 },
  ];
}

export function getQuickActions(role: Role): QuickAction[] {
  if (role === "inhaber") {
    return [
      { label: "Mitarbeiter einladen", href: "/dashboard/mitarbeiter" },
      { label: "Klient anlegen", href: "/dashboard/klienten" },
      { label: "Standort hinzufügen", href: "/dashboard/standorte" },
      { label: "Dienst planen", href: "/dashboard/dienstplanung" },
      { label: "Dokument hochladen", href: "/dashboard/dokumente" },
      { label: "Zahlung & Tarif öffnen", href: "/dashboard/zahlung-tarif" },
    ];
  }

  if (role === "pdl") {
    return [
      { label: "Dienst planen", href: "/dashboard/dienstplanung" },
      { label: "Tour vorbereiten", href: "/dashboard/tourenplanung" },
      { label: "Klient anlegen", href: "/dashboard/klienten" },
      { label: "Dokument hochladen", href: "/dashboard/dokumente" },
      { label: "QM/MD öffnen", href: "/dashboard/qm-md" },
      { label: "Nachricht schreiben", href: "/dashboard/kommunikation" },
    ];
  }

  if (role === "verwaltung") {
    return [
      { label: "Klient anlegen", href: "/dashboard/klienten" },
      { label: "Dokument hochladen", href: "/dashboard/dokumente" },
      { label: "Abrechnung öffnen", href: "/dashboard/abrechnung" },
      { label: "Nachricht schreiben", href: "/dashboard/kommunikation" },
      { label: "Bewerber öffnen", href: "/dashboard/bewerber" },
    ];
  }

  if (role === "mitarbeiter") {
    return [
      { label: "Meine Tour öffnen", href: "/mitarbeiter/tour" },
      { label: "Notiz hinzufügen", href: "/mitarbeiter/notizen" },
      { label: "Dokument fotografieren", href: "/mitarbeiter/dokumente-hochladen" },
      { label: "Zeit erfassen", href: "/mitarbeiter/zeiterfassung" },
      { label: "Nachricht schreiben", href: "/mitarbeiter/kommunikation" },
    ];
  }

  return [];
}

async function countRows(
  supabase: SupabaseClient,
  table: string,
  applyFilters: (query: SupabaseQuery) => SupabaseQuery,
) {
  const query = applyFilters(supabase.from(table).select("id", { count: "exact", head: true }));
  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function companyFilter(query: SupabaseQuery, companyId: string | null) {
  return companyId ? query.eq("company_id", companyId) : query;
}

async function getCompanyStats(supabase: SupabaseClient, context: QueryContext) {
  const values = await Promise.all([
    countRows(supabase, "clients", (query) => companyFilter(query, context.companyId)),
    countRows(supabase, "profiles", (query) => companyFilter(query.in("role", employeeRoles), context.companyId)),
    countRows(supabase, "shifts", (query) => companyFilter(query.eq("date", context.today), context.companyId)),
    countRows(supabase, "tours", (query) => companyFilter(query.eq("date", context.today), context.companyId)),
    countRows(supabase, "tasks", (query) => companyFilter(query.in("status", openStatuses), context.companyId)),
    countRows(supabase, "documents", (query) => companyFilter(query.in("status", openStatuses), context.companyId)),
    countRows(supabase, "messages", (query) => companyFilter(query.is("read_at", null), context.companyId)),
    countRows(supabase, "billing_items", (query) => companyFilter(query.in("status", openStatuses), context.companyId)),
    countRows(supabase, "qm_items", (query) => companyFilter(query.in("status", openStatuses), context.companyId)),
    countRows(supabase, "applicants", (query) => companyFilter(query.in("status", openStatuses), context.companyId)),
    countRows(supabase, "website_leads", (query) => companyFilter(query.in("status", openStatuses), context.companyId)),
  ]);

  return emptyCompanyStats().map((stat, index) => ({ ...stat, value: values[index] ?? 0 }));
}

async function getStaffStats(supabase: SupabaseClient, context: QueryContext) {
  const values = await Promise.all([
    countRows(supabase, "shifts", (query) =>
      companyFilter(query.eq("date", context.today).eq("employee_id", context.userId ?? ""), context.companyId),
    ),
    countRows(supabase, "tours", (query) =>
      companyFilter(query.eq("date", context.today).eq("employee_id", context.userId ?? ""), context.companyId),
    ),
    countRows(supabase, "shifts", (query) =>
      companyFilter(query.eq("date", context.today).eq("employee_id", context.userId ?? "").not("client_id", "is", null), context.companyId),
    ),
    countRows(supabase, "tasks", (query) =>
      companyFilter(query.in("status", openStatuses).eq("assigned_to", context.userId ?? ""), context.companyId),
    ),
    countRows(supabase, "messages", (query) => companyFilter(query.is("read_at", null), context.companyId)),
    countRows(supabase, "documents", (query) =>
      companyFilter(query.in("status", openStatuses).eq("uploaded_by", context.userId ?? ""), context.companyId),
    ),
    0,
  ]);

  return emptyStaffStats().map((stat, index) => ({ ...stat, value: values[index] ?? 0 }));
}

async function getMessages(supabase: SupabaseClient, context: QueryContext): Promise<OverviewMessage[]> {
  let query = supabase
    .from("messages")
    .select("id, body, created_at, sender:profiles(first_name,last_name,role,staff_code)")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(4);

  query = companyFilter(query, context.companyId);

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((message) => {
    const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender;
    const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(" ");

    return {
      id: message.id,
      sender: senderName || "Unbekannt",
      roleOrCode: sender?.staff_code || sender?.role || "",
      time: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at)),
      preview: preview(message.body),
    };
  });
}

async function getNews(supabase: SupabaseClient, context: QueryContext): Promise<OverviewNews[]> {
  let query = supabase
    .from("nuria_news")
    .select("id, title, body, published_at, created_at")
    .or(`is_global.eq.true,company_id.eq.${context.companyId ?? "00000000-0000-0000-0000-000000000000"}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(3);

  if (context.role !== "admin") {
    query = query.or(`target_role.is.null,target_role.eq.${context.role}`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    title: item.title,
    date: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(item.published_at ?? item.created_at),
    ),
    preview: preview(item.body),
  }));
}

export async function getDashboardOverview(role: Role): Promise<DashboardOverviewData> {
  const context: QueryContext = {
    role,
    companyId: process.env.NURIA_DEV_COMPANY_ID ?? null,
    userId: process.env.NURIA_DEV_USER_ID ?? null,
    today: todayIsoDate(),
  };
  const supabase = getSupabaseServerClient();
  const emptyStats = role === "mitarbeiter" ? emptyStaffStats() : emptyCompanyStats();

  if (!supabase) {
    return {
      stats: emptyStats,
      quickActions: getQuickActions(role),
      messages: [],
      news: [],
    };
  }

  const [stats, messages, news] = await Promise.all([
    role === "mitarbeiter" ? getStaffStats(supabase, context) : getCompanyStats(supabase, context),
    getMessages(supabase, context),
    getNews(supabase, context),
  ]);

  return {
    stats,
    quickActions: getQuickActions(role),
    messages,
    news,
  };
}
