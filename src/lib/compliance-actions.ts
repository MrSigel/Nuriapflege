"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { writeActivityLog } from "@/lib/activity-log-actions";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const categories = ["datenschutz", "zugriffskontrolle", "rollen_rechte", "exporte", "loeschungen", "dokumentation", "aufbewahrung", "technische_massnahmen", "organisatorische_massnahmen", "mitarbeiterzugriff", "pruefprotokolle", "sonstiges"] as const;
const statuses = ["open", "in_progress", "waiting", "completed", "overdue", "archived"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const evidenceTypes = ["document", "note", "check", "export_log", "access_log", "deletion_log", "other"] as const;

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

async function ref(table: "company_locations" | "profiles" | "documents" | "compliance_items", id: string | null, companyId: string) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Auswahl ist ungueltig.");
  return id;
}

async function itemPayload(formData: FormData, companyId: string) {
  const status = one(text(formData.get("status")), statuses, "Status");
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

async function context() {
  return requireCompanyRole(["inhaber", "pdl"]);
}

export async function createComplianceItem(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const payload = await itemPayload(formData, companyId);
  const { data } = await supabase
    .from("compliance_items")
    .insert({ ...payload, company_id: companyId, created_by: userId, updated_by: userId })
    .select("id,title")
    .single();

  if (data) await writeActivityLog({ companyId, userId, action: "created", entityType: "system", entityId: data.id, entityLabel: data.title, message: "Compliance-Pruefpunkt wurde erstellt." });
  revalidatePath("/dashboard/compliance");
}

export async function updateComplianceItem(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  const payload = await itemPayload(formData, companyId);
  await supabase.from("compliance_items").update({ ...payload, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  await writeActivityLog({ companyId, userId, action: "updated", entityType: "system", entityId: id, entityLabel: payload.title, message: "Compliance-Pruefpunkt wurde geaendert." });
  revalidatePath("/dashboard/compliance");
}

export async function changeComplianceItemStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const status = one(text(formData.get("status")), statuses, "Status");
  if (!supabase || !companyId) return;

  await supabase
    .from("compliance_items")
    .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null, archived_at: status === "archived" ? new Date().toISOString() : null, updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  await writeActivityLog({ companyId, userId, action: status === "archived" ? "archived" : "status_changed", entityType: "system", entityId: id, message: "Compliance-Status wurde geaendert." });
  revalidatePath("/dashboard/compliance");
}

export async function changeComplianceItemPriority(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const priority = one(text(formData.get("priority")), priorities, "Prioritaet");
  if (!supabase || !companyId) return;

  await supabase.from("compliance_items").update({ priority, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  await writeActivityLog({ companyId, userId, action: "updated", entityType: "system", entityId: id, message: "Compliance-Prioritaet wurde geaendert." });
  revalidatePath("/dashboard/compliance");
}

export async function createComplianceEvidence(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const payload = {
    compliance_item_id: await ref("compliance_items", required(formData, "compliance_item_id"), companyId),
    document_id: await ref("documents", text(formData.get("document_id")), companyId),
    title: required(formData, "title"),
    description: text(formData.get("description")),
    evidence_type: one(text(formData.get("evidence_type")), evidenceTypes, "Nachweistyp"),
  };
  const { data } = await supabase.from("compliance_evidence").insert({ ...payload, company_id: companyId, created_by: userId }).select("id,title").single();
  if (data) await writeActivityLog({ companyId, userId, action: "created", entityType: "system", entityId: data.id, entityLabel: data.title, message: "Compliance-Nachweis wurde hinzugefuegt." });
  revalidatePath("/dashboard/compliance");
}
