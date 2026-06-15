"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { CareLevel, ClientStatus } from "@/lib/clients";

const statuses = ["active", "inactive", "paused"] as const;
const careLevels = ["none", "1", "2", "3", "4", "5", "applied", "unknown"] as const;

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

function validateStatus(value: string | null): ClientStatus {
  if (!value || !statuses.includes(value as ClientStatus)) throw new Error("Status ist ungültig.");
  return value as ClientStatus;
}

function validateCareLevel(value: string | null): CareLevel {
  if (!value || !careLevels.includes(value as CareLevel)) throw new Error("Pflegegrad ist ungültig.");
  return value as CareLevel;
}

function validateDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Geburtsdatum ist ungültig.");
  return value;
}

async function validateLocation(companyId: string, locationId: string | null) {
  if (!locationId) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from("company_locations").select("id").eq("company_id", companyId).eq("id", locationId).maybeSingle();
  if (!data) throw new Error("Standort ist ungültig.");
  return locationId;
}

async function parseClientPayload(formData: FormData, companyId: string) {
  return {
    client_number: sanitize(formData.get("client_number")),
    first_name: requireText(formData, "first_name"),
    last_name: requireText(formData, "last_name"),
    date_of_birth: validateDate(sanitize(formData.get("date_of_birth"))),
    gender: sanitize(formData.get("gender")),
    street: sanitize(formData.get("street")),
    house_number: sanitize(formData.get("house_number")),
    postal_code: sanitize(formData.get("postal_code")),
    city: sanitize(formData.get("city")),
    phone: sanitize(formData.get("phone")),
    email: validateEmail(sanitize(formData.get("email"))),
    care_level: validateCareLevel(sanitize(formData.get("care_level"))),
    insurance_provider: sanitize(formData.get("insurance_provider")),
    insurance_number: sanitize(formData.get("insurance_number")),
    primary_contact_name: sanitize(formData.get("primary_contact_name")),
    primary_contact_phone: sanitize(formData.get("primary_contact_phone")),
    primary_contact_email: validateEmail(sanitize(formData.get("primary_contact_email"))),
    primary_contact_relation: sanitize(formData.get("primary_contact_relation")),
    location_id: await validateLocation(companyId, sanitize(formData.get("location_id"))),
    status: validateStatus(sanitize(formData.get("status"))),
    notes: sanitize(formData.get("notes")),
  };
}

export async function createClient(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  if (!supabase || !companyId) return;

  const payload = await parseClientPayload(formData, companyId);
  await supabase.from("clients").insert({ ...payload, company_id: companyId, created_by: userId, updated_by: userId });
  revalidatePath("/dashboard/klienten");
}

export async function updateClient(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = requireText(formData, "id");
  if (!supabase || !companyId) return;

  const payload = await parseClientPayload(formData, companyId);
  await supabase.from("clients").update({ ...payload, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/klienten");
}

export async function changeClientStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();
  const id = requireText(formData, "id");
  const status = validateStatus(sanitize(formData.get("status")));
  if (!supabase || !companyId) return;

  await supabase.from("clients").update({ status, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  revalidatePath("/dashboard/klienten");
}
