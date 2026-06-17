"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { ShiftStatus, ShiftType } from "@/lib/shifts";

const statuses = ["planned", "in_progress", "completed", "cancelled"] as const;
const shiftTypes = ["pflegeeinsatz", "hauswirtschaft", "beratung", "verwaltung", "bereitschaft", "sonstiges"] as const;

function sanitize(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function requireText(formData: FormData, key: string) {
  const value = sanitize(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function validateStatus(value: string | null): ShiftStatus {
  if (!value || !statuses.includes(value as ShiftStatus)) throw new Error("Status ist ungültig.");
  return value as ShiftStatus;
}

function validateShiftType(value: string | null): ShiftType {
  if (!value || !shiftTypes.includes(value as ShiftType)) throw new Error("Diensttyp ist ungültig.");
  return value as ShiftType;
}

function validateDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Datum ist ungültig.");
  return value;
}

function validateTimes(start: string | null, end: string | null) {
  if (start && end && start > end) throw new Error("Startzeit darf nicht nach Endzeit liegen.");
}

async function validateForeignId(table: string, companyId: string, id: string | null) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Zuweisung ist ungültig.");
  return id;
}

async function parseShiftPayload(formData: FormData, companyId: string) {
  const start = sanitize(formData.get("suggested_start_time"));
  const end = sanitize(formData.get("suggested_end_time"));
  validateTimes(start, end);

  return {
    title: requireText(formData, "title"),
    date: validateDate(requireText(formData, "date")),
    suggested_start_time: start,
    suggested_end_time: end,
    shift_type: validateShiftType(sanitize(formData.get("shift_type"))),
    status: validateStatus(sanitize(formData.get("status"))),
    location_id: await validateForeignId("company_locations", companyId, sanitize(formData.get("location_id"))),
    employee_id: await validateForeignId("profiles", companyId, sanitize(formData.get("employee_id"))),
    client_id: await validateForeignId("clients", companyId, sanitize(formData.get("client_id"))),
    notes: sanitize(formData.get("notes")),
  };
}

export async function createShift(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
  if (!supabase) return;

  const payload = await parseShiftPayload(formData, context.companyId);
  await supabase.from("shifts").insert({ ...payload, company_id: context.companyId, created_by: context.userId, updated_by: context.userId });
  revalidatePath("/dashboard/dienstplanung");
}

export async function updateShift(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
  const id = requireText(formData, "id");
  if (!supabase) return;

  const payload = await parseShiftPayload(formData, context.companyId);
  await supabase.from("shifts").update({ ...payload, updated_by: context.userId }).eq("id", id).eq("company_id", context.companyId);
  revalidatePath("/dashboard/dienstplanung");
}

export async function changeShiftStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
  const id = requireText(formData, "id");
  const status = validateStatus(sanitize(formData.get("status")));
  if (!supabase) return;

  await supabase.from("shifts").update({ status, updated_by: context.userId }).eq("id", id).eq("company_id", context.companyId);
  revalidatePath("/dashboard/dienstplanung");
}
