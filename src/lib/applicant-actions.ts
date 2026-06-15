"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { ApplicantPosition, ApplicantRating, ApplicantSource, ApplicantStatus } from "@/lib/applicants";

const statuses = ["new", "contacted", "interview_planned", "interview_done", "offer_sent", "hired", "rejected", "archived"] as const;
const ratings = ["none", "interesting", "strong", "not_suitable"] as const;
const sources = ["manual", "website", "facebook", "instagram", "recommendation", "job_portal", "phone", "email", "other"] as const;
const positions = ["pflegefachkraft", "pflegehelfer", "hauswirtschaft", "betreuungskraft", "verwaltung", "pdl", "azubi", "quereinsteiger", "sonstiges"] as const;

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

function getUserId() {
  return process.env.NURIA_DEV_USER_ID ?? null;
}

function sanitize(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function requireText(formData: FormData, key: string) {
  const value = sanitize(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function validateEmail(email: string | null) {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-Mail ist ungültig.");
  return email;
}

function validateStatus(value: string | null): ApplicantStatus {
  if (!value || !statuses.includes(value as ApplicantStatus)) throw new Error("Status ist ungültig.");
  return value as ApplicantStatus;
}

function validateRating(value: string | null): ApplicantRating {
  if (!value || !ratings.includes(value as ApplicantRating)) throw new Error("Bewertung ist ungültig.");
  return value as ApplicantRating;
}

function validateSource(value: string | null): ApplicantSource {
  if (!value || !sources.includes(value as ApplicantSource)) throw new Error("Quelle ist ungültig.");
  return value as ApplicantSource;
}

function validatePosition(value: string | null): ApplicantPosition {
  if (!value || !positions.includes(value as ApplicantPosition)) throw new Error("Position ist ungültig.");
  return value as ApplicantPosition;
}

function validateDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Datum ist ungültig.");
  return date.toISOString();
}

async function validateLocation(companyId: string, locationId: string | null) {
  if (!locationId) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from("company_locations").select("id").eq("company_id", companyId).eq("id", locationId).maybeSingle();
  if (!data) throw new Error("Standort ist ungültig.");
  return locationId;
}

async function parseApplicantPayload(formData: FormData, companyId: string) {
  const status = validateStatus(sanitize(formData.get("status")));

  return {
    first_name: requireText(formData, "first_name"),
    last_name: requireText(formData, "last_name"),
    email: validateEmail(sanitize(formData.get("email"))),
    phone: sanitize(formData.get("phone")),
    desired_position: validatePosition(sanitize(formData.get("desired_position"))),
    qualification: sanitize(formData.get("qualification")),
    availability: sanitize(formData.get("availability")),
    source: validateSource(sanitize(formData.get("source"))),
    location_id: await validateLocation(companyId, sanitize(formData.get("location_id"))),
    status,
    rating: validateRating(sanitize(formData.get("rating"))),
    notes: sanitize(formData.get("notes")),
    last_contact_at: validateDateTime(sanitize(formData.get("last_contact_at"))),
    next_follow_up_at: validateDateTime(sanitize(formData.get("next_follow_up_at"))),
    archived_at: status === "archived" ? new Date().toISOString() : null,
  };
}

export async function createApplicant(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  if (!supabase || !companyId) return;

  const payload = await parseApplicantPayload(formData, companyId);
  await supabase.from("applicants").insert({ ...payload, company_id: companyId, created_by: userId, updated_by: userId });
  revalidatePath("/dashboard/bewerber");
}

export async function updateApplicant(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = requireText(formData, "id");
  if (!supabase || !companyId) return;

  const payload = await parseApplicantPayload(formData, companyId);
  await supabase.from("applicants").update({ ...payload, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/bewerber");
}

export async function changeApplicantStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = requireText(formData, "id");
  const status = validateStatus(sanitize(formData.get("status")));
  if (!supabase || !companyId) return;

  await supabase
    .from("applicants")
    .update({ status, archived_at: status === "archived" ? new Date().toISOString() : null, updated_by: userId })
    .eq("id", id)
    .eq("company_id", companyId);
  revalidatePath("/dashboard/bewerber");
}

export async function changeApplicantRating(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = requireText(formData, "id");
  const rating = validateRating(sanitize(formData.get("rating")));
  if (!supabase || !companyId) return;

  await supabase.from("applicants").update({ rating, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/bewerber");
}

export async function setApplicantFollowUp(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = requireText(formData, "id");
  const next_follow_up_at = validateDateTime(sanitize(formData.get("next_follow_up_at")));
  if (!supabase || !companyId) return;

  await supabase.from("applicants").update({ next_follow_up_at, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/bewerber");
}
