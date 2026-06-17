"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { TimeEntrySource, TimeEntryStatus, TimeEntryType } from "@/lib/time-tracking";

const statuses = ["draft", "submitted", "approved", "rejected", "corrected"] as const;
const types = ["work_time", "client_visit", "tour_time", "break", "admin_time", "other"] as const;
const sources = ["manual", "tour_wizard", "system"] as const;

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function status(value: string | null): TimeEntryStatus {
  if (!value || !statuses.includes(value as TimeEntryStatus)) throw new Error("Status ist ungueltig.");
  return value as TimeEntryStatus;
}

function entryType(value: string | null): TimeEntryType {
  if (!value || !types.includes(value as TimeEntryType)) throw new Error("Eintragstyp ist ungueltig.");
  return value as TimeEntryType;
}

function source(value: string | null): TimeEntrySource {
  if (!value || !sources.includes(value as TimeEntrySource)) throw new Error("Quelle ist ungueltig.");
  return value as TimeEntrySource;
}

function minutes(start: string, end: string, breakMinutes: number) {
  if (start > end) throw new Error("Startzeit darf nicht nach Endzeit liegen.");
  if (breakMinutes < 0) throw new Error("Pause darf nicht negativ sein.");
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return Math.max(0, endHour * 60 + endMinute - (startHour * 60 + startMinute) - breakMinutes);
}

async function own(table: string, companyId: string, id: string | null) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Zuweisung ist ungueltig.");
  return id;
}

async function payload(formData: FormData, companyId: string) {
  const start = required(formData, "start_time");
  const end = required(formData, "end_time");
  const breakMinutes = Number(text(formData.get("break_minutes")) ?? "0");

  return {
    employee_id: await own("profiles", companyId, required(formData, "employee_id")),
    entry_date: required(formData, "entry_date"),
    start_time: start,
    end_time: end,
    break_minutes: breakMinutes,
    duration_minutes: minutes(start, end, breakMinutes),
    entry_type: entryType(text(formData.get("entry_type"))),
    status: status(text(formData.get("status"))),
    source: source(text(formData.get("source")) ?? "manual"),
    location_id: await own("company_locations", companyId, text(formData.get("location_id"))),
    client_id: await own("clients", companyId, text(formData.get("client_id"))),
    shift_id: await own("shifts", companyId, text(formData.get("shift_id"))),
    tour_id: await own("tours", companyId, text(formData.get("tour_id"))),
    tour_stop_id: await own("tour_stops", companyId, text(formData.get("tour_stop_id"))),
    notes: text(formData.get("notes")),
  };
}

async function audit(companyId: string, userId: string, id: string, action: string, newValues: unknown) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("time_entry_audit_logs").insert({
    company_id: companyId,
    time_entry_id: id,
    changed_by: userId,
    action,
    new_values: newValues,
  });
}

async function context() {
  return requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
}

export async function createTimeEntry(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const row = { ...(await payload(formData, companyId)), company_id: companyId, created_by: userId, updated_by: userId };
  const { data } = await supabase.from("time_entries").insert(row).select("id").single();
  if (data) await audit(companyId, userId, data.id, "created", row);
  revalidatePath("/dashboard/zeiterfassung");
}

export async function updateTimeEntry(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  const row = { ...(await payload(formData, companyId)), updated_by: userId };
  await supabase.from("time_entries").update(row).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, id, row.status === "corrected" ? "corrected" : "updated", row);
  revalidatePath("/dashboard/zeiterfassung");
}

export async function reviewTimeEntry(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const next = status(required(formData, "status"));
  if (!supabase || !companyId) return;

  const row = { status: next, reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_by: userId };
  await supabase.from("time_entries").update(row).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, id, next === "approved" ? "approved" : next === "rejected" ? "rejected" : "corrected", row);
  revalidatePath("/dashboard/zeiterfassung");
}
