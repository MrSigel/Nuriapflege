"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireCompanyManager } from "@/lib/current-user";
import { createInviteToken, hashInviteToken, inviteLink } from "@/lib/invitations";
import { sendMail } from "@/lib/mailer";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { EmployeeRole, EmployeeStatus, InvitationStatus } from "@/lib/employees";

const roles = ["inhaber", "pdl", "verwaltung", "mitarbeiter", "pflegefachkraft"] as const;
const statuses = ["active", "inactive", "invited", "pending"] as const;
const invitationStatuses = ["not_invited", "invited", "accepted", "expired"] as const;

type ActionResult = { ok: boolean; message?: string };

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

export async function inviteEmployee(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));
  if (!supabase || "error" in context || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "Einladung konnte nicht gespeichert werden." };
  }

  const email = validateEmail(requireText(formData, "email"));
  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const password = randomUUID() + randomUUID();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: sanitize(formData.get("role")) ?? "mitarbeiter" },
  });

  if (authError || !authUser.user?.id) {
    return { ok: false, message: "Einladung konnte nicht gespeichert werden." };
  }

  const id = authUser.user.id;
  const { error } = await supabase.from("profiles").insert({
    id,
    company_id: context.companyId,
    first_name: requireText(formData, "first_name"),
    last_name: requireText(formData, "last_name"),
    email,
    role: validateRole(sanitize(formData.get("role"))),
    staff_code: validateStaffCode(requireText(formData, "staff_code")),
    phone: sanitize(formData.get("phone")),
    qualification: sanitize(formData.get("qualification")),
    status: "invited",
    invitation_status: "invited",
    invited_by: context.userId,
    invited_at: new Date().toISOString(),
    invitation_token_hash: hashInviteToken(token),
    invitation_expires_at: expiresAt,
  });

  if (error) {
    await supabase.auth.admin.deleteUser(id);
    return { ok: false, message: "Einladung konnte nicht gespeichert werden." };
  }

  await replaceEmployeeLocations(context.companyId, id, selectedLocationIds(formData));

  const link = inviteLink(token);
  const mail = await sendMail({
    to: email,
    subject: "Einladung zu Nuria Pflege",
    text: `Sie wurden zu Nuria Pflege eingeladen. Einladung öffnen: ${link}`,
    html: `<p>Sie wurden zu Nuria Pflege eingeladen.</p><p><a href="${link}">Einladung öffnen</a></p>`,
  });

  if (mail.ok) {
    await supabase.from("profiles").update({ invitation_sent_at: new Date().toISOString() }).eq("id", id).eq("company_id", context.companyId);
  }

  revalidatePath("/dashboard/mitarbeiter");
  if (!mail.ok && mail.configured === false) return { ok: true, message: mail.message };
  return mail.ok ? { ok: true, message: "Einladung wurde gespeichert und versendet." } : { ok: false, message: mail.message };
}

export async function createEmployee(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));
  if (!supabase || "error" in context) return { ok: false, message: "Mitarbeiter konnte nicht gespeichert werden." };

  const id = randomUUID();
  const { error } = await supabase.from("profiles").insert({
    id,
    company_id: context.companyId,
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
  if (error) return { ok: false, message: "Mitarbeiter konnte nicht gespeichert werden." };

  await replaceEmployeeLocations(context.companyId, id, selectedLocationIds(formData));
  revalidatePath("/dashboard/mitarbeiter");
  return { ok: true, message: "Mitarbeiter wurde gespeichert." };
}

export async function updateEmployee(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));
  const id = requireText(formData, "id");
  if (!supabase || "error" in context) return { ok: false, message: "Mitarbeiter konnte nicht gespeichert werden." };

  const { error } = await supabase
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
    .eq("company_id", context.companyId)
    .neq("role", "admin");
  if (error) return { ok: false, message: "Mitarbeiter konnte nicht gespeichert werden." };

  await replaceEmployeeLocations(context.companyId, id, selectedLocationIds(formData));
  revalidatePath("/dashboard/mitarbeiter");
  return { ok: true, message: "Mitarbeiter wurde gespeichert." };
}

export async function toggleEmployeeStatus(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));
  const id = requireText(formData, "id");
  const status = validateStatus(sanitize(formData.get("status")));
  const role = validateRole(sanitize(formData.get("role")));
  if (!supabase || "error" in context) return { ok: false, message: "Status konnte nicht geändert werden." };

  if (role === "inhaber" && status === "active" && (await activeOwnerCount(context.companyId)) <= 1) {
    return { ok: false, message: "Der letzte aktive Inhaber kann nicht deaktiviert werden." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: status === "active" ? "inactive" : "active" })
    .eq("id", id)
    .eq("company_id", context.companyId)
    .neq("role", "admin");
  if (error) return { ok: false, message: "Status konnte nicht geändert werden." };

  revalidatePath("/dashboard/mitarbeiter");
  return { ok: true, message: "Status wurde geändert." };
}
