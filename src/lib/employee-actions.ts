"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { EmployeeRole, EmployeeStatus, InvitationStatus } from "@/lib/employees";

const roles = ["inhaber", "pdl", "verwaltung", "mitarbeiter", "pflegefachkraft"] as const;
const statuses = ["active", "inactive", "invited", "pending"] as const;
const invitationStatuses = ["not_invited", "invited", "accepted", "expired"] as const;

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
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

function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-Mail ist ungültig.");
  return email;
}

function validateRole(value: string | null): EmployeeRole {
  if (!value || !roles.includes(value as EmployeeRole)) throw new Error("Rolle ist ungültig.");
  return value as EmployeeRole;
}

function validateStatus(value: string | null): EmployeeStatus {
  if (!value || !statuses.includes(value as EmployeeStatus)) throw new Error("Status ist ungültig.");
  return value as EmployeeStatus;
}

function validateInvitationStatus(value: string | null): InvitationStatus {
  if (!value || !invitationStatuses.includes(value as InvitationStatus)) throw new Error("Einladungsstatus ist ungültig.");
  return value as InvitationStatus;
}

function validateStaffCode(value: string) {
  const normalized = value.toUpperCase();
  if (!/^[A-ZÄÖÜ0-9]{2,5}$/.test(normalized)) throw new Error("Kürzel ist ungültig.");
  return normalized;
}

function selectedLocationIds(formData: FormData) {
  return formData.getAll("location_ids").map((value) => (typeof value === "string" ? value : "")).filter(Boolean);
}

async function replaceEmployeeLocations(companyId: string, employeeId: string, locationIds: string[]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("employee_locations").delete().eq("company_id", companyId).eq("employee_id", employeeId);
  if (locationIds.length === 0) return;

  const { data: validLocations } = await supabase.from("company_locations").select("id").eq("company_id", companyId).in("id", locationIds);
  const rows = (validLocations ?? []).map((location) => ({ company_id: companyId, employee_id: employeeId, location_id: location.id }));
  if (rows.length > 0) await supabase.from("employee_locations").insert(rows);
}

async function activeOwnerCount(companyId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "inhaber")
    .eq("status", "active");

  return count ?? 0;
}

export async function inviteEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  if (!supabase || !companyId) return;

  const id = randomUUID();
  await supabase.from("profiles").insert({
    id,
    company_id: companyId,
    first_name: requireText(formData, "first_name"),
    last_name: requireText(formData, "last_name"),
    email: validateEmail(requireText(formData, "email")),
    role: validateRole(sanitize(formData.get("role"))),
    staff_code: validateStaffCode(requireText(formData, "staff_code")),
    phone: sanitize(formData.get("phone")),
    qualification: sanitize(formData.get("qualification")),
    status: "invited",
    invitation_status: "invited",
    invited_at: new Date().toISOString(),
  });

  await replaceEmployeeLocations(companyId, id, selectedLocationIds(formData));
  revalidatePath("/dashboard/mitarbeiter");
}

export async function createEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  if (!supabase || !companyId) return;

  const id = randomUUID();
  await supabase.from("profiles").insert({
    id,
    company_id: companyId,
    first_name: requireText(formData, "first_name"),
    last_name: requireText(formData, "last_name"),
    email: validateEmail(requireText(formData, "email")),
    phone: sanitize(formData.get("phone")),
    role: validateRole(sanitize(formData.get("role"))),
    staff_code: validateStaffCode(requireText(formData, "staff_code")),
    qualification: sanitize(formData.get("qualification")),
    status: validateStatus(sanitize(formData.get("status"))),
    invitation_status: "not_invited",
  });

  await replaceEmployeeLocations(companyId, id, selectedLocationIds(formData));
  revalidatePath("/dashboard/mitarbeiter");
}

export async function updateEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = requireText(formData, "id");
  if (!supabase || !companyId) return;

  await supabase
    .from("profiles")
    .update({
      first_name: requireText(formData, "first_name"),
      last_name: requireText(formData, "last_name"),
      phone: sanitize(formData.get("phone")),
      role: validateRole(sanitize(formData.get("role"))),
      staff_code: validateStaffCode(requireText(formData, "staff_code")),
      qualification: sanitize(formData.get("qualification")),
      status: validateStatus(sanitize(formData.get("status"))),
      invitation_status: validateInvitationStatus(sanitize(formData.get("invitation_status"))),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .neq("role", "admin");

  await replaceEmployeeLocations(companyId, id, selectedLocationIds(formData));
  revalidatePath("/dashboard/mitarbeiter");
}

export async function toggleEmployeeStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = requireText(formData, "id");
  const status = validateStatus(sanitize(formData.get("status")));
  const role = validateRole(sanitize(formData.get("role")));
  if (!supabase || !companyId) return;

  if (role === "inhaber" && status === "active" && (await activeOwnerCount(companyId)) <= 1) return;

  await supabase
    .from("profiles")
    .update({ status: status === "active" ? "inactive" : "active" })
    .eq("id", id)
    .eq("company_id", companyId)
    .neq("role", "admin");

  revalidatePath("/dashboard/mitarbeiter");
}
