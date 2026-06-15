"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { OnlinePriority, OnlineTaskStatus, OnlineTaskType, WebsiteLeadSource, WebsiteLeadStatus, WebsiteLeadType } from "@/lib/website-online";

const leadTypes = ["general","care_request","callback_request","job_application","cooperation","complaint","other"] as const;
const sources = ["website","contact_form","phone","email","facebook","instagram","google","recommendation","manual","other"] as const;
const leadStatuses = ["new","in_progress","waiting","done","rejected","archived"] as const;
const priorities = ["low","normal","high","urgent"] as const;
const taskTypes = ["website_update","google_profile","social_media","content","photos","job_posting","review_management","other"] as const;
const taskStatuses = ["open","in_progress","done","archived"] as const;

function companyId() { return process.env.NURIA_DEV_COMPANY_ID ?? null; }
function userId() { return process.env.NURIA_DEV_USER_ID ?? null; }
function text(v: FormDataEntryValue | null) { const s = typeof v === "string" ? v.trim() : ""; return s || null; }
function required(fd: FormData, key: string) { const v = text(fd.get(key)); if (!v) throw new Error("Pflichtfeld fehlt."); return v; }
function email(v: string | null) { if (!v) return null; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error("E-Mail ist ungültig."); return v; }
function one<T extends readonly string[]>(value: string | null, allowed: T, label: string) { if (!value || !allowed.includes(value)) throw new Error(`${label} ist ungültig.`); return value as T[number]; }
function dateTime(v: string | null) { if (!v) return null; const d = new Date(v); if (Number.isNaN(d.getTime())) throw new Error("Datum ist ungültig."); return d.toISOString(); }
function dateOnly(v: string | null) { if (!v) return null; const d = new Date(v); if (Number.isNaN(d.getTime())) throw new Error("Datum ist ungültig."); return v; }

async function validateRef(table: "company_locations" | "profiles", id: string | null, cid: string) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from(table).select("id").eq("company_id", cid).eq("id", id).maybeSingle();
  if (!data) throw new Error("Auswahl ist ungültig.");
  return id;
}

async function leadPayload(fd: FormData, cid: string) {
  const status = one(text(fd.get("status")), leadStatuses, "Status") as WebsiteLeadStatus;
  return {
    first_name: text(fd.get("first_name")),
    last_name: text(fd.get("last_name")),
    organization_name: text(fd.get("organization_name")),
    email: email(text(fd.get("email"))),
    phone: text(fd.get("phone")),
    subject: required(fd, "subject"),
    message: text(fd.get("message")),
    lead_type: one(text(fd.get("lead_type")), leadTypes, "Typ") as WebsiteLeadType,
    source: one(text(fd.get("source")), sources, "Quelle") as WebsiteLeadSource,
    status,
    priority: one(text(fd.get("priority")), priorities, "Priorität") as OnlinePriority,
    location_id: await validateRef("company_locations", text(fd.get("location_id")), cid),
    assigned_to: await validateRef("profiles", text(fd.get("assigned_to")), cid),
    last_contact_at: dateTime(text(fd.get("last_contact_at"))),
    next_follow_up_at: dateTime(text(fd.get("next_follow_up_at"))),
    notes: text(fd.get("notes")),
    archived_at: status === "archived" ? new Date().toISOString() : null,
  };
}

async function taskPayload(fd: FormData, cid: string) {
  const status = one(text(fd.get("status")), taskStatuses, "Status") as OnlineTaskStatus;
  return {
    title: required(fd, "title"),
    description: text(fd.get("description")),
    task_type: one(text(fd.get("task_type")), taskTypes, "Aufgabentyp") as OnlineTaskType,
    status,
    priority: one(text(fd.get("priority")), priorities, "Priorität") as OnlinePriority,
    location_id: await validateRef("company_locations", text(fd.get("location_id")), cid),
    assigned_to: await validateRef("profiles", text(fd.get("assigned_to")), cid),
    due_date: dateOnly(text(fd.get("due_date"))),
    completed_at: status === "done" ? new Date().toISOString() : null,
    archived_at: status === "archived" ? new Date().toISOString() : null,
  };
}

export async function createWebsiteLead(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); if (!supabase || !cid) return; await supabase.from("website_leads").insert({ ...(await leadPayload(fd, cid)), company_id: cid, created_by: userId(), updated_by: userId() }); revalidatePath("/dashboard/website-online-praesenz"); }
export async function updateWebsiteLead(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); if (!supabase || !cid) return; await supabase.from("website_leads").update({ ...(await leadPayload(fd, cid)), updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
export async function changeWebsiteLeadStatus(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); const status = one(text(fd.get("status")), leadStatuses, "Status"); if (!supabase || !cid) return; await supabase.from("website_leads").update({ status, archived_at: status === "archived" ? new Date().toISOString() : null, updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
export async function changeWebsiteLeadPriority(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); const priority = one(text(fd.get("priority")), priorities, "Priorität"); if (!supabase || !cid) return; await supabase.from("website_leads").update({ priority, updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
export async function setWebsiteLeadFollowUp(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); if (!supabase || !cid) return; await supabase.from("website_leads").update({ next_follow_up_at: dateTime(text(fd.get("next_follow_up_at"))), updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
export async function createOnlineTask(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); if (!supabase || !cid) return; await supabase.from("online_presence_tasks").insert({ ...(await taskPayload(fd, cid)), company_id: cid, created_by: userId(), updated_by: userId() }); revalidatePath("/dashboard/website-online-praesenz"); }
export async function updateOnlineTask(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); if (!supabase || !cid) return; await supabase.from("online_presence_tasks").update({ ...(await taskPayload(fd, cid)), updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
export async function changeOnlineTaskStatus(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); const status = one(text(fd.get("status")), taskStatuses, "Status"); if (!supabase || !cid) return; await supabase.from("online_presence_tasks").update({ status, completed_at: status === "done" ? new Date().toISOString() : null, archived_at: status === "archived" ? new Date().toISOString() : null, updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
export async function changeOnlineTaskPriority(fd: FormData) { const supabase = getSupabaseServerClient(); const cid = companyId(); const id = required(fd, "id"); const priority = one(text(fd.get("priority")), priorities, "Priorität"); if (!supabase || !cid) return; await supabase.from("online_presence_tasks").update({ priority, updated_by: userId() }).eq("id", id).eq("company_id", cid); revalidatePath("/dashboard/website-online-praesenz"); }
