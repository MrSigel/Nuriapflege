"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { TourStatus, TourStopStatus } from "@/lib/tours";

const tourStatuses = ["planned", "in_progress", "completed", "cancelled"] as const;
const stopStatuses = ["planned", "in_progress", "completed", "skipped", "cancelled"] as const;

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

function getUserId() {
  return process.env.NURIA_DEV_USER_ID ?? null;
}

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function tourStatus(value: string | null): TourStatus {
  if (!value || !tourStatuses.includes(value as TourStatus)) throw new Error("Status ist ungültig.");
  return value as TourStatus;
}

function stopStatus(value: string | null): TourStopStatus {
  if (!value || !stopStatuses.includes(value as TourStopStatus)) throw new Error("Tourstopp-Status ist ungültig.");
  return value as TourStopStatus;
}

function validDate(value: string) {
  if (Number.isNaN(new Date(value).getTime())) throw new Error("Datum ist ungültig.");
  return value;
}

function validTimes(start: string | null, end: string | null) {
  if (start && end && start > end) throw new Error("Startzeit darf nicht nach Endzeit liegen.");
}

async function own(table: string, companyId: string, id: string | null) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Zuweisung ist ungültig.");
  return id;
}

async function tourPayload(formData: FormData, companyId: string) {
  const start = text(formData.get("suggested_start_time"));
  const end = text(formData.get("suggested_end_time"));
  validTimes(start, end);
  return {
    title: required(formData, "title"),
    tour_date: validDate(required(formData, "tour_date")),
    date: validDate(required(formData, "tour_date")),
    suggested_start_time: start,
    suggested_end_time: end,
    location_id: await own("company_locations", companyId, text(formData.get("location_id"))),
    employee_id: await own("profiles", companyId, text(formData.get("employee_id"))),
    status: tourStatus(text(formData.get("status"))),
    notes: text(formData.get("notes")),
  };
}

export async function createTour(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  if (!supabase || !companyId) return;
  await supabase.from("tours").insert({ ...(await tourPayload(formData, companyId)), company_id: companyId, created_by: userId, updated_by: userId });
  revalidatePath("/dashboard/tourenplanung");
}

export async function updateTour(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;
  await supabase.from("tours").update({ ...(await tourPayload(formData, companyId)), updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/tourenplanung");
}

export async function changeTourStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;
  await supabase.from("tours").update({ status: tourStatus(text(formData.get("status"))), updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/tourenplanung");
}

export async function upsertTourStop(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = text(formData.get("id"));
  const tourId = await own("tours", companyId ?? "", required(formData, "tour_id"));
  if (!supabase || !companyId || !tourId) return;
  const payload = {
    company_id: companyId,
    tour_id: tourId,
    client_id: await own("clients", companyId, required(formData, "client_id")),
    shift_id: await own("shifts", companyId, text(formData.get("shift_id"))),
    sort_order: Number(text(formData.get("sort_order")) ?? "0"),
    suggested_time: text(formData.get("suggested_time")),
    tasks: text(formData.get("tasks")),
    notes: text(formData.get("notes")),
    status: stopStatus(text(formData.get("status"))),
  };
  if (id) await supabase.from("tour_stops").update(payload).eq("id", id).eq("company_id", companyId);
  else await supabase.from("tour_stops").insert(payload);
  revalidatePath("/dashboard/tourenplanung");
}

export async function deleteTourStop(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;
  await supabase.from("tour_stops").delete().eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/tourenplanung");
}

export async function moveTourStop(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = required(formData, "id");
  const sortOrder = Number(required(formData, "sort_order"));
  const direction = required(formData, "direction");
  if (!supabase || !companyId) return;
  await supabase.from("tour_stops").update({ sort_order: Math.max(0, sortOrder + (direction === "up" ? -1 : 1)) }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/tourenplanung");
}
