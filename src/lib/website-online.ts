import { getSupabaseServerClient } from "@/lib/supabase-server";

export type WebsiteLeadType = "general" | "care_request" | "callback_request" | "job_application" | "cooperation" | "complaint" | "other";
export type WebsiteLeadSource = "website" | "contact_form" | "phone" | "email" | "facebook" | "instagram" | "google" | "recommendation" | "manual" | "other";
export type WebsiteLeadStatus = "new" | "in_progress" | "waiting" | "done" | "rejected" | "archived";
export type OnlinePriority = "low" | "normal" | "high" | "urgent";
export type OnlineTaskType = "website_update" | "google_profile" | "social_media" | "content" | "photos" | "job_posting" | "review_management" | "other";
export type OnlineTaskStatus = "open" | "in_progress" | "done" | "archived";

export type OnlineOption = { id: string; name: string };
export type WebsiteLead = {
  id: string; company_id: string; location_id: string | null; first_name: string | null; last_name: string | null; organization_name: string | null; email: string | null; phone: string | null; subject: string; message: string | null; lead_type: WebsiteLeadType; source: WebsiteLeadSource; status: WebsiteLeadStatus; priority: OnlinePriority; assigned_to: string | null; last_contact_at: string | null; next_follow_up_at: string | null; notes: string | null; created_at: string; updated_at: string; archived_at: string | null; location_name: string | null; assigned_name: string | null;
};
export type OnlinePresenceTask = {
  id: string; company_id: string; location_id: string | null; title: string; description: string | null; task_type: OnlineTaskType; status: OnlineTaskStatus; priority: OnlinePriority; assigned_to: string | null; due_date: string | null; completed_at: string | null; created_at: string; updated_at: string; archived_at: string | null; location_name: string | null; assigned_name: string | null;
};
export type WebsiteOnlineData = {
  leads: WebsiteLead[];
  tasks: OnlinePresenceTask[];
  locations: OnlineOption[];
  employees: OnlineOption[];
  stats: { totalLeads: number; newLeads: number; inProgress: number; urgentLeads: number; openTasks: number; doneTasks: number; openFollowUps: number; archived: number };
  exportPrepared: boolean;
};

function getCompanyId() { return process.env.NURIA_DEV_COMPANY_ID ?? null; }
function nameOf(row: { first_name?: string | null; last_name?: string | null; email?: string | null }) { return [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Nicht hinterlegt"; }

export async function getWebsiteOnlineData(): Promise<WebsiteOnlineData> {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const empty = { leads: [], tasks: [], locations: [], employees: [], stats: { totalLeads: 0, newLeads: 0, inProgress: 0, urgentLeads: 0, openTasks: 0, doneTasks: 0, openFollowUps: 0, archived: 0 }, exportPrepared: false };
  if (!supabase || !companyId) return empty;

  const [{ data: leads }, { data: tasks }, { data: locations }, { data: employees }] = await Promise.all([
    supabase.from("website_leads").select("id, company_id, location_id, first_name, last_name, organization_name, email, phone, subject, message, lead_type, source, status, priority, assigned_to, last_contact_at, next_follow_up_at, notes, created_at, updated_at, archived_at, company_locations(name), profiles(first_name,last_name,email)").eq("company_id", companyId).order("updated_at", { ascending: false }),
    supabase.from("online_presence_tasks").select("id, company_id, location_id, title, description, task_type, status, priority, assigned_to, due_date, completed_at, created_at, updated_at, archived_at, company_locations(name), profiles(first_name,last_name,email)").eq("company_id", companyId).order("updated_at", { ascending: false }),
    supabase.from("company_locations").select("id, name").eq("company_id", companyId).order("name"),
    supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", companyId).order("last_name"),
  ]);

  const normalizedLeads = (leads ?? []).map((lead) => ({ ...lead, lead_type: lead.lead_type ?? "general", source: lead.source ?? "website", status: lead.status ?? "new", priority: lead.priority ?? "normal", location_name: Array.isArray(lead.company_locations) ? lead.company_locations[0]?.name ?? null : (lead.company_locations as { name?: string } | null)?.name ?? null, assigned_name: Array.isArray(lead.profiles) ? nameOf(lead.profiles[0] ?? {}) : nameOf((lead.profiles as { first_name?: string | null; last_name?: string | null; email?: string | null } | null) ?? {}) })) as WebsiteLead[];
  const normalizedTasks = (tasks ?? []).map((task) => ({ ...task, task_type: task.task_type ?? "other", status: task.status ?? "open", priority: task.priority ?? "normal", location_name: Array.isArray(task.company_locations) ? task.company_locations[0]?.name ?? null : (task.company_locations as { name?: string } | null)?.name ?? null, assigned_name: Array.isArray(task.profiles) ? nameOf(task.profiles[0] ?? {}) : nameOf((task.profiles as { first_name?: string | null; last_name?: string | null; email?: string | null } | null) ?? {}) })) as OnlinePresenceTask[];
  const now = Date.now();
  const openFollowUps = normalizedLeads.filter((lead) => lead.next_follow_up_at && lead.status !== "archived" && new Date(lead.next_follow_up_at).getTime() <= now).length + normalizedTasks.filter((task) => task.due_date && task.status !== "done" && task.status !== "archived" && new Date(task.due_date).getTime() <= now).length;
  return {
    leads: normalizedLeads,
    tasks: normalizedTasks,
    locations: (locations ?? []) as OnlineOption[],
    employees: (employees ?? []).map((employee) => ({ id: employee.id, name: nameOf(employee) })),
    stats: { totalLeads: normalizedLeads.filter((l) => l.status !== "archived").length, newLeads: normalizedLeads.filter((l) => l.status === "new").length, inProgress: normalizedLeads.filter((l) => l.status === "in_progress").length, urgentLeads: normalizedLeads.filter((l) => l.priority === "urgent" && l.status !== "archived").length, openTasks: normalizedTasks.filter((t) => t.status !== "done" && t.status !== "archived").length, doneTasks: normalizedTasks.filter((t) => t.status === "done").length, openFollowUps, archived: normalizedLeads.filter((l) => l.status === "archived").length + normalizedTasks.filter((t) => t.status === "archived").length },
    exportPrepared: false,
  };
}
