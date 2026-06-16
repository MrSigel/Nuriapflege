import { calculatePlan, plans, type BillingInterval } from "@/lib/payment";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type OnboardingStatus = "in_progress" | "completed";

export type OnboardingData = {
  company: {
    id: string;
    name: string | null;
    legal_name: string | null;
    email: string | null;
    phone: string | null;
    street: string | null;
    house_number: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    ik_number: string | null;
    onboarding_status: OnboardingStatus | null;
    payment_status: string | null;
    package_id: string | null;
    billing_interval: BillingInterval | null;
    payment_marked_at: string | null;
    payment_due_until: string | null;
    payment_due_check_at: string | null;
    admin_confirmed_at: string | null;
  } | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  primaryLocation: {
    id: string;
    name: string | null;
    street: string | null;
    house_number: string | null;
    postal_code: string | null;
    city: string | null;
    phone: string | null;
    contact_person: string | null;
  } | null;
  paymentLog: { id: string; amount: number; status: string; marked_at: string | null } | null;
  plans: ReturnType<typeof calculatePlan>[];
  bank: { recipient: string; iban: string; bic: string; bank: string; purpose: string };
  canWrite: boolean;
  isOverdue: boolean;
};

export function companyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

export function userId() {
  return process.env.NURIA_DEV_USER_ID ?? null;
}

export function canCompanyWrite(company: { onboarding_status?: string | null; payment_status?: string | null; admin_confirmed_at?: string | null; payment_due_until?: string | null; payment_due_check_at?: string | null } | null) {
  if (!company) return false;
  if (company.payment_status === "active") return true;
  if (company.payment_status !== "payment_marked_as_sent" || company.onboarding_status !== "completed") return false;
  const due = company.payment_due_until ?? company.payment_due_check_at;
  return !due || Boolean(company.admin_confirmed_at) || new Date(due).getTime() >= Date.now();
}

export function isCompanyPaymentOverdue(company: { payment_status?: string | null; admin_confirmed_at?: string | null; payment_due_until?: string | null; payment_due_check_at?: string | null } | null) {
  const due = company?.payment_due_until ?? company?.payment_due_check_at;
  return Boolean(company?.payment_status === "payment_marked_as_sent" && due && !company.admin_confirmed_at && new Date(due).getTime() < Date.now());
}

export async function getCompanyAccessState() {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  if (!supabase || !cid) return { canWrite: false, isOverdue: false, company: null };
  const { data: company } = await supabase
    .from("companies")
    .select("id,onboarding_status,payment_status,payment_due_until,payment_due_check_at,admin_confirmed_at")
    .eq("id", cid)
    .maybeSingle();
  return { canWrite: canCompanyWrite(company), isOverdue: isCompanyPaymentOverdue(company), company };
}

export async function getOnboardingData(): Promise<OnboardingData> {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  const uid = userId();
  const planList = (Object.keys(plans) as BillingInterval[]).map(calculatePlan);
  const empty = {
    company: null,
    owner: null,
    primaryLocation: null,
    paymentLog: null,
    plans: planList,
    bank: { recipient: "Enrico Gross", iban: "DE17100101788022253533", bic: "REVODEB2", bank: "Revolut", purpose: "" },
    canWrite: false,
    isOverdue: false,
  };

  if (!supabase || !cid) return empty;

  const [{ data: company }, { data: owner }, { data: primaryLocation }, { data: paymentLog }] = await Promise.all([
    supabase
      .from("companies")
      .select("id,name,legal_name,email,phone,street,house_number,postal_code,city,country,ik_number,onboarding_status,payment_status,package_id,billing_interval,payment_marked_at,payment_due_until,payment_due_check_at,admin_confirmed_at")
      .eq("id", cid)
      .maybeSingle(),
    uid
      ? supabase.from("profiles").select("id,first_name,last_name,email").eq("id", uid).eq("company_id", cid).maybeSingle()
      : supabase.from("profiles").select("id,first_name,last_name,email").eq("company_id", cid).eq("role", "inhaber").limit(1).maybeSingle(),
    supabase
      .from("company_locations")
      .select("id,name,street,house_number,postal_code,city,phone,contact_person")
      .eq("company_id", cid)
      .eq("is_primary", true)
      .maybeSingle(),
    supabase
      .from("company_payment_logs")
      .select("id,amount,status,marked_at")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const purpose = paymentLog?.id ? `NURIA-${cid}-${paymentLog.id}` : `NURIA-${cid}-OFFEN`;

  return {
    company: company as OnboardingData["company"],
    owner: owner as OnboardingData["owner"],
    primaryLocation: primaryLocation as OnboardingData["primaryLocation"],
    paymentLog: paymentLog ? { ...paymentLog, amount: Number(paymentLog.amount ?? 0) } : null,
    plans: planList,
    bank: { recipient: "Enrico Gross", iban: "DE17100101788022253533", bic: "REVODEB2", bank: "Revolut", purpose },
    canWrite: canCompanyWrite(company),
    isOverdue: isCompanyPaymentOverdue(company),
  };
}
