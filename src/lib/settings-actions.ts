"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { defaultCompanySettings } from "@/lib/settings";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function has(formData: FormData, key: string) {
  return formData.has(key);
}

function validateEmail(value: string | null, label: string) {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `${label} ist ungültig.`;
  }
  return null;
}

function validateWebsite(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return null;
  } catch {
    return "Website ist ungültig.";
  }

  return "Website ist ungültig.";
}

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

export async function saveSettings(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const supabase = getSupabaseServerClient();
  let context;

  try {
    context = await requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
  } catch {
    return { ok: false, message: "Keine Berechtigung fuer diese Aktion." };
  }

  const { companyId, userId } = context;

  if (!supabase || !companyId) {
    return { ok: false, message: "Einstellungen konnten nicht gespeichert werden." };
  }

  const activeTab = text(formData, "active_tab");
  const email = text(formData, "email");
  const billingEmail = text(formData, "billing_email");
  const website = text(formData, "website");
  const validationError = validateEmail(email, "E-Mail") ?? validateEmail(billingEmail, "Rechnungs-E-Mail") ?? validateWebsite(website);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  const companyUpdate: Record<string, string | null> = {};
  const companyKeys = [
    "name",
    "legal_name",
    "ik_number",
    "website",
    "status",
    "email",
    "phone",
    "street",
    "house_number",
    "postal_code",
    "city",
    "state",
    "country",
    "billing_email",
    "billing_interval",
    "tax_number",
  ];

  for (const key of companyKeys) {
    if (has(formData, key)) companyUpdate[key] = text(formData, key);
  }

  if (Object.keys(companyUpdate).length > 0) {
    const companyResult = await supabase
      .from("companies")
      .update(companyUpdate)
      .eq("id", companyId);

    if (companyResult.error) {
      return { ok: false, message: "Unternehmensdaten konnten nicht gespeichert werden." };
    }
  }

  if (activeTab === "system") {
    const companySettingsResult = await supabase.from("company_settings").upsert(
      {
        company_id: companyId,
        timezone: text(formData, "timezone") ?? defaultCompanySettings.timezone,
        date_format: text(formData, "date_format") ?? defaultCompanySettings.date_format,
        week_start: text(formData, "week_start") ?? defaultCompanySettings.week_start,
        default_language: text(formData, "default_language") ?? defaultCompanySettings.default_language,
      },
      { onConflict: "company_id" },
    );

    if (companySettingsResult.error) {
      return { ok: false, message: "System- und Rollen-Einstellungen konnten nicht gespeichert werden." };
    }
  }

  if (activeTab === "roles") {
    const companySettingsResult = await supabase.from("company_settings").upsert(
      {
        company_id: companyId,
        allow_pdl_manage_employees: bool(formData, "allow_pdl_manage_employees"),
        allow_pdl_manage_roles: bool(formData, "allow_pdl_manage_roles"),
        allow_pdl_export: bool(formData, "allow_pdl_export"),
        allow_verwaltung_export: bool(formData, "allow_verwaltung_export"),
      },
      { onConflict: "company_id" },
    );

    if (companySettingsResult.error) {
      return { ok: false, message: "System- und Rollen-Einstellungen konnten nicht gespeichert werden." };
    }
  }

  if (userId && activeTab === "notifications") {
    const userSettingsResult = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        company_id: companyId,
        notifications_enabled: bool(formData, "internal_system_notifications"),
        email_notifications: bool(formData, "email_notifications"),
        internal_system_notifications: bool(formData, "internal_system_notifications"),
        payment_status_notifications: bool(formData, "payment_status_notifications"),
        new_message_notifications: bool(formData, "new_message_notifications"),
        new_document_notifications: bool(formData, "new_document_notifications"),
        new_application_notifications: bool(formData, "new_application_notifications"),
      },
      { onConflict: "user_id,company_id" },
    );

    if (userSettingsResult.error) {
      return { ok: false, message: "Benutzereinstellungen konnten nicht gespeichert werden." };
    }
  }

  revalidatePath("/dashboard/einstellungen");
  return { ok: true, message: "Änderungen wurden gespeichert." };
}
