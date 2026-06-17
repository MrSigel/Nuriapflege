"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { CareCategory, CareStatus, CareVisibility } from "@/lib/care-documentation";

const categories = ["pflegebericht", "uebergabe", "beobachtung", "massnahme", "vitalwerte", "wunde", "medikation", "ereignis", "sonstiges"] as const;
const statuses = ["draft", "submitted", "reviewed", "archived"] as const;
const visibilities = ["internal", "care_team", "management"] as const;

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function category(value: string | null): CareCategory {
  if (!value || !categories.includes(value as CareCategory)) throw new Error("Kategorie ist ungueltig.");
  return value as CareCategory;
}

function status(value: string | null): CareStatus {
  if (!value || !statuses.includes(value as CareStatus)) throw new Error("Status ist ungueltig.");
  return value as CareStatus;
}

function visibility(value: string | null): CareVisibility {
  if (!value || !visibilities.includes(value as CareVisibility)) throw new Error("Sichtbarkeit ist ungueltig.");
  return value as CareVisibility;
}

async function own(table: string, companyId: string, id: string | null, isRequired = false) {
  if (!id) {
    if (isRequired) throw new Error("Pflichtfeld fehlt.");
    return null;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Zuweisung ist ungueltig.");
  return id;
}

async function payload(formData: FormData, companyId: string) {
  return {
    client_id: await own("clients", companyId, required(formData, "client_id"), true),
    employee_id: await own("profiles", companyId, text(formData.get("employee_id"))),
    shift_id: await own("shifts", companyId, text(formData.get("shift_id"))),
    tour_id: await own("tours", companyId, text(formData.get("tour_id"))),
    tour_stop_id: await own("tour_stops", companyId, text(formData.get("tour_stop_id"))),
    documentation_date: required(formData, "documentation_date"),
    documentation_time: text(formData.get("documentation_time")),
    category: category(text(formData.get("category"))),
    title: required(formData, "title"),
    content: required(formData, "content"),
    status: status(text(formData.get("status"))),
    visibility: visibility(text(formData.get("visibility"))),
  };
}

async function audit(companyId: string, userId: string, id: string, action: string, row: unknown) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("care_documentation_audit_logs").insert({
    company_id: companyId,
    documentation_id: id,
    changed_by: userId,
    action,
    new_values: row,
  });
}

async function vitals(formData: FormData, companyId: string, userId: string, docId: string, clientId: string) {
  const keys = ["blood_pressure_systolic", "blood_pressure_diastolic", "pulse", "temperature", "blood_sugar", "weight", "oxygen_saturation", "vital_notes"];
  if (!keys.some((key) => text(formData.get(key)))) return;

  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("care_vitals").upsert(
    {
      company_id: companyId,
      documentation_id: docId,
      client_id: clientId,
      measured_at: new Date().toISOString(),
      blood_pressure_systolic: text(formData.get("blood_pressure_systolic")),
      blood_pressure_diastolic: text(formData.get("blood_pressure_diastolic")),
      pulse: text(formData.get("pulse")),
      temperature: text(formData.get("temperature")),
      blood_sugar: text(formData.get("blood_sugar")),
      weight: text(formData.get("weight")),
      oxygen_saturation: text(formData.get("oxygen_saturation")),
      notes: text(formData.get("vital_notes")),
      created_by: userId,
    },
    { onConflict: "documentation_id" },
  );
}

async function context() {
  return requireCompanyRole(["inhaber", "pdl"]);
}

export async function createCareDoc(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const row = { ...(await payload(formData, companyId)), company_id: companyId, created_by: userId, updated_by: userId };
  const { data } = await supabase.from("care_documentation").insert(row).select("id, client_id").single();

  if (data) {
    await vitals(formData, companyId, userId, data.id, data.client_id);
    await audit(companyId, userId, data.id, "created", row);
  }
  revalidatePath("/dashboard/pflegedokumentation");
}

export async function updateCareDoc(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  const row = { ...(await payload(formData, companyId)), updated_by: userId };
  await supabase.from("care_documentation").update(row).eq("id", id).eq("company_id", companyId);
  if (row.client_id) await vitals(formData, companyId, userId, id, row.client_id);
  await audit(companyId, userId, id, "updated", row);
  revalidatePath("/dashboard/pflegedokumentation");
}

export async function reviewCareDoc(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const next = status(required(formData, "status"));
  if (!supabase || !companyId) return;

  const row =
    next === "reviewed"
      ? { status: next, reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_by: userId }
      : { status: next, updated_by: userId };

  await supabase.from("care_documentation").update(row).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, id, next === "reviewed" ? "reviewed" : "archived", row);
  revalidatePath("/dashboard/pflegedokumentation");
}
