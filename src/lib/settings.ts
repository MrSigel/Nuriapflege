import { getSupabaseServerClient } from "@/lib/supabase-server";
import { pricingModel } from "@/lib/nuria-config";

export type CompanySettingsData = {
  company: {
    id: string;
    name: string | null;
    legal_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    street: string | null;
    house_number: string | null;
    postal_code: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    ik_number: string | null;
    tax_number: string | null;
    billing_email: string | null;
    status: string | null;
    payment_status: string | null;
    package_id: string | null;
    billing_interval: string | null;
  } | null;
  settings: {
    timezone: string;
    date_format: string;
    week_start: string;
    default_language: string;
    allow_pdl_manage_employees: boolean;
    allow_pdl_manage_roles: boolean;
    allow_pdl_export: boolean;
    allow_verwaltung_export: boolean;
  };
  userSettings: {
    theme: string;
    notifications_enabled: boolean;
    email_notifications: boolean;
    internal_system_notifications: boolean;
    payment_status_notifications: boolean;
    new_message_notifications: boolean;
    new_document_notifications: boolean;
    new_application_notifications: boolean;
  };
  owner: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    staff_code: string | null;
  } | null;
  pricing: typeof pricingModel;
};

export const defaultCompanySettings = {
  timezone: "Europe/Berlin",
  date_format: "DD.MM.YYYY",
  week_start: "monday",
  default_language: "de",
  allow_pdl_manage_employees: false,
  allow_pdl_manage_roles: false,
  allow_pdl_export: false,
  allow_verwaltung_export: false,
};

export const defaultUserSettings = {
  theme: "system",
  notifications_enabled: true,
  email_notifications: true,
  internal_system_notifications: true,
  payment_status_notifications: true,
  new_message_notifications: true,
  new_document_notifications: true,
  new_application_notifications: true,
};

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

function getUserId() {
  return process.env.NURIA_DEV_USER_ID ?? null;
}

export async function getSettingsData(): Promise<CompanySettingsData> {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const userId = getUserId();

  if (!supabase || !companyId) {
    return {
      company: null,
      settings: defaultCompanySettings,
      userSettings: defaultUserSettings,
      owner: null,
      pricing: pricingModel,
    };
  }

  await supabase.from("company_settings").upsert(
    {
      company_id: companyId,
      ...defaultCompanySettings,
    },
    { onConflict: "company_id", ignoreDuplicates: true },
  );

  if (userId) {
    await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        company_id: companyId,
        ...defaultUserSettings,
      },
      { onConflict: "user_id,company_id", ignoreDuplicates: true },
    );
  }

  const [{ data: company }, { data: settings }, { data: owner }, { data: userSettings }] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, legal_name, email, phone, website, street, house_number, postal_code, city, state, country, ik_number, tax_number, billing_email, status, payment_status, package_id, billing_interval",
      )
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("company_settings")
      .select("timezone, date_format, week_start, default_language, allow_pdl_manage_employees, allow_pdl_manage_roles, allow_pdl_export, allow_verwaltung_export")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, role, staff_code")
      .eq("company_id", companyId)
      .eq("role", "inhaber")
      .limit(1)
      .maybeSingle(),
    userId
      ? supabase
          .from("user_settings")
          .select(
            "theme, notifications_enabled, email_notifications, internal_system_notifications, payment_status_notifications, new_message_notifications, new_document_notifications, new_application_notifications",
          )
          .eq("company_id", companyId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    company: company ?? null,
    settings: { ...defaultCompanySettings, ...(settings ?? {}) },
    userSettings: { ...defaultUserSettings, ...(userSettings ?? {}) },
    owner: owner ?? null,
    pricing: pricingModel,
  };
}
