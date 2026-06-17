"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type {
  OnlinePriority,
  OnlineTaskStatus,
  OnlineTaskType,
  WebsiteLeadSource,
  WebsiteLeadStatus,
  WebsiteLeadType,
} from "@/lib/website-online";

const leadTypes = ["general", "care_request", "callback_request", "job_application", "cooperation", "complaint", "other"] as const;
const sources = ["website", "contact_form", "phone", "email", "facebook", "instagram", "google", "recommendation", "manual", "other"] as const;
const leadStatuses = ["new", "in_progress", "waiting", "done", "rejected", "archived"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const taskTypes = ["website_update", "google_profile", "social_media", "content", "photos", "job_posting", "review_management", "other"] as const;
const taskStatuses = ["open", "in_progress", "done", "archived"] as const;

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function email(value: string | null) {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("E-Mail ist ungueltig.");
  return value;
}

function one<T extends readonly string[]>(value: string | null, allowed: T, label: string) {
  if (!value || !allowed.includes(value)) throw new Error(`${label} ist ungueltig.`);
  return value as T[number];
}

function dateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Datum ist ungueltig.");
  return date.toISOString();
}

function dateOnly(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Datum ist ungueltig.");
  return value;
}

async function validateRef(table: "company_locations" | "profiles", id: string | null, companyId: string) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Auswahl ist ungueltig.");
  return id;
}

async function leadPayload(formData: FormData, companyId: string) {
  const status = one(text(formData.get("status")), leadStatuses, "Status") as WebsiteLeadStatus;

  return {
    first_name: text(formData.get("first_name")),
    last_name: text(formData.get("last_name")),
    organization_name: text(formData.get("organization_name")),
    email: email(text(formData.get("email"))),
    phone: text(formData.get("phone")),
    subject: required(formData, "subject"),
    message: text(formData.get("message")),
    lead_type: one(text(formData.get("lead_type")), leadTypes, "Typ") as WebsiteLeadType,
    source: one(text(formData.get("source")), sources, "Quelle") as WebsiteLeadSource,
    status,
    priority: one(text(formData.get("priority")), priorities, "Prioritaet") as OnlinePriority,
    location_id: await validateRef("company_locations", text(formData.get("location_id")), companyId),
    assigned_to: await validateRef("profiles", text(formData.get("assigned_to")), companyId),
    last_contact_at: dateTime(text(formData.get("last_contact_at"))),
    next_follow_up_at: dateTime(text(formData.get("next_follow_up_at"))),
    notes: text(formData.get("notes")),
    archived_at: status === "archived" ? new Date().toISOString() : null,
  };
}

async function taskPayload(formData: FormData, companyId: string) {
  const status = one(text(formData.get("status")), taskStatuses, "Status") as OnlineTaskStatus;

  return {
    title: required(formData, "title"),
    description: text(formData.get("description")),
    task_type: one(text(formData.get("task_type")), taskTypes, "Aufgabentyp") as OnlineTaskType,
    status,
    priority: one(text(formData.get("priority")), priorities, "Prioritaet") as OnlinePriority,
    location_id: await validateRef("company_locations", text(formData.get("location_id")), companyId),
    assigned_to: await validateRef("profiles", text(formData.get("assigned_to")), companyId),
    due_date: dateOnly(text(formData.get("due_date"))),
    completed_at: status === "done" ? new Date().toISOString() : null,
    archived_at: status === "archived" ? new Date().toISOString() : null,
  };
}

async function context() {
  return requireCompanyRole(["inhaber", "verwaltung"]);
}

export async function createWebsiteLead(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  await supabase.from("website_leads").insert({
    ...(await leadPayload(formData, companyId)),
    company_id: companyId,
    created_by: userId,
    updated_by: userId,
  });
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function updateWebsiteLead(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase
    .from("website_leads")
    .update({ ...(await leadPayload(formData, companyId)), updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function changeWebsiteLeadStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const status = one(text(formData.get("status")), leadStatuses, "Status");
  if (!supabase || !companyId) return;

  await supabase
    .from("website_leads")
    .update({ status, archived_at: status === "archived" ? new Date().toISOString() : null, updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function changeWebsiteLeadPriority(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const priority = one(text(formData.get("priority")), priorities, "Prioritaet");
  if (!supabase || !companyId) return;

  await supabase.from("website_leads").update({ priority, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function setWebsiteLeadFollowUp(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase
    .from("website_leads")
    .update({ next_follow_up_at: dateTime(text(formData.get("next_follow_up_at"))), updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function createOnlineTask(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  await supabase.from("online_presence_tasks").insert({
    ...(await taskPayload(formData, companyId)),
    company_id: companyId,
    created_by: userId,
    updated_by: userId,
  });
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function updateOnlineTask(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase
    .from("online_presence_tasks")
    .update({ ...(await taskPayload(formData, companyId)), updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function changeOnlineTaskStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const status = one(text(formData.get("status")), taskStatuses, "Status");
  if (!supabase || !companyId) return;

  await supabase
    .from("online_presence_tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
      updated_by: userId,
    })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}

export async function changeOnlineTaskPriority(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const priority = one(text(formData.get("priority")), priorities, "Prioritaet");
  if (!supabase || !companyId) return;

  await supabase.from("online_presence_tasks").update({ priority, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/website-online-praesenz");
}
