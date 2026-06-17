"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const categories = ["organisation", "pflegeprozess", "dokumentation", "mitarbeiter", "hygiene", "medikamente", "notfallmanagement", "datenschutz", "abrechnung", "fortbildungen", "beschwerden", "md_vorbereitung", "sonstiges"] as const;
const itemStatuses = ["open", "in_progress", "waiting", "completed", "overdue", "archived"] as const;
const measureStatuses = ["open", "in_progress", "completed", "cancelled"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const evidenceTypes = ["document", "note", "check", "photo", "other"] as const;

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function one<T extends readonly string[]>(value: string | null, allowed: T, label: string) {
  if (!value || !allowed.includes(value)) throw new Error(`${label} ist ungueltig.`);
  return value as T[number];
}

function date(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Datum ist ungueltig.");
  return value;
}

async function ref(table: "company_locations" | "profiles" | "qm_items" | "documents", id: string | null, companyId: string) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Auswahl ist ungueltig.");
  return id;
}

async function itemPayload(formData: FormData, companyId: string) {
  const status = one(text(formData.get("status")), itemStatuses, "Status");
  return {
    title: required(formData, "title"),
    description: text(formData.get("description")),
    category: one(text(formData.get("category")), categories, "Kategorie"),
    status,
    priority: one(text(formData.get("priority")), priorities, "Prioritaet"),
    location_id: await ref("company_locations", text(formData.get("location_id")), companyId),
    responsible_user_id: await ref("profiles", text(formData.get("responsible_user_id")), companyId),
    due_date: date(text(formData.get("due_date"))),
    last_checked_at: date(text(formData.get("last_checked_at"))),
    notes: text(formData.get("notes")),
    completed_at: status === "completed" ? new Date().toISOString() : null,
    archived_at: status === "archived" ? new Date().toISOString() : null,
  };
}

async function measurePayload(formData: FormData, companyId: string) {
  const status = one(text(formData.get("status")), measureStatuses, "Status");
  return {
    qm_item_id: await ref("qm_items", required(formData, "qm_item_id"), companyId),
    title: required(formData, "title"),
    description: text(formData.get("description")),
    status,
    priority: one(text(formData.get("priority")), priorities, "Prioritaet"),
    responsible_user_id: await ref("profiles", text(formData.get("responsible_user_id")), companyId),
    due_date: date(text(formData.get("due_date"))),
    notes: text(formData.get("notes")),
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };
}

async function evidencePayload(formData: FormData, companyId: string) {
  return {
    qm_item_id: await ref("qm_items", required(formData, "qm_item_id"), companyId),
    document_id: await ref("documents", text(formData.get("document_id")), companyId),
    title: required(formData, "title"),
    description: text(formData.get("description")),
    evidence_type: one(text(formData.get("evidence_type")), evidenceTypes, "Nachweistyp"),
  };
}

async function context() {
  return requireCompanyRole(["inhaber", "pdl"]);
}

export async function createQmItem(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  await supabase.from("qm_items").insert({ ...(await itemPayload(formData, companyId)), company_id: companyId, created_by: userId, updated_by: userId });
  revalidatePath("/dashboard/qm-md");
}

export async function updateQmItem(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase.from("qm_items").update({ ...(await itemPayload(formData, companyId)), updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function changeQmItemStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const status = one(text(formData.get("status")), itemStatuses, "Status");
  if (!supabase || !companyId) return;

  await supabase
    .from("qm_items")
    .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null, archived_at: status === "archived" ? new Date().toISOString() : null, updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function changeQmItemPriority(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const priority = one(text(formData.get("priority")), priorities, "Prioritaet");
  if (!supabase || !companyId) return;

  await supabase.from("qm_items").update({ priority, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function setQmItemDueDate(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase.from("qm_items").update({ due_date: date(text(formData.get("due_date"))), updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function createQmMeasure(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  await supabase.from("qm_measures").insert({ ...(await measurePayload(formData, companyId)), company_id: companyId, created_by: userId, updated_by: userId });
  revalidatePath("/dashboard/qm-md");
}

export async function updateQmMeasure(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase.from("qm_measures").update({ ...(await measurePayload(formData, companyId)), updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function changeQmMeasureStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const status = one(text(formData.get("status")), measureStatuses, "Status");
  if (!supabase || !companyId) return;

  await supabase.from("qm_measures").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function changeQmMeasurePriority(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const priority = one(text(formData.get("priority")), priorities, "Prioritaet");
  if (!supabase || !companyId) return;

  await supabase.from("qm_measures").update({ priority, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/qm-md");
}

export async function createQmEvidence(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  await supabase.from("qm_evidence").insert({ ...(await evidencePayload(formData, companyId)), company_id: companyId, created_by: userId });
  revalidatePath("/dashboard/qm-md");
}
