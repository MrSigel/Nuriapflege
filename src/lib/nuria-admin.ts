import { notFound, redirect } from "next/navigation";
import { hasValidNuriaAdminSession } from "@/lib/nuria-admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { AdminCompany, AdminLog, AdminUser, NuriaAdminData, NuriaAdminSection, SupportRequest } from "@/lib/nuria-admin-shared";

export async function requireNuriaAdmin() {
  if (!(await hasValidNuriaAdminSession())) {
    redirect("/nuria-admin/login");
  }

  return null;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function companyNameMap(companies: { id: string; name: string }[]) {
  return new Map(companies.map((company) => [company.id, company.name]));
}

export async function getNuriaAdminData(): Promise<NuriaAdminData> {
  await requireNuriaAdmin();
  const adminUserId = null;
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      adminUserId,
      companies: [],
      users: [],
      supportRequests: [],
      logs: [],
      stats: {
        totalCompanies: 0,
        newRegistrations: 0,
        activeCompanies: 0,
        openPayments: 0,
        markedPayments: 0,
        lockedAccounts: 0,
        newSupport: 0,
        systemEvents: 0,
      },
    };
  }

  const [{ data: companyRows }, { data: profileRows }, { data: subscriptionRows }, { data: paymentRows }, { data: supportRows }, { data: replyRows }, { data: logRows }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id,name,email,billing_email,status,package_id,billing_interval,onboarding_status,payment_status,payment_marked_at,payment_due_until,admin_confirmed_at,locked_at,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,company_id,first_name,last_name,email,role,status,created_at").order("created_at", { ascending: false }),
      supabase
        .from("company_subscriptions")
        .select("id,company_id,package_id,total_amount,status,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("company_payment_logs")
        .select("id,company_id,subscription_id,amount,billing_interval,status,marked_at,confirmed_at,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("support_requests").select("id,company_id,name,email,subject,message,status,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("support_replies").select("id,support_request_id,body,created_at").order("created_at", { ascending: true }),
      supabase.from("admin_logs").select("id,company_id,admin_user_id,action,target_type,target_id,metadata,created_at").order("created_at", { ascending: false }).limit(200),
    ]);

  const companiesBase = (companyRows ?? []) as any[];
  const profiles = (profileRows ?? []) as any[];
  const companyNames = companyNameMap(companiesBase);
  const owners = new Map(
    profiles
      .filter((profile) => profile.role === "inhaber")
      .map((profile) => [
        profile.company_id,
        {
          name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt",
          email: profile.email ?? null,
        },
      ]),
  );
  const latestSubscription = new Map<string, any>();
  for (const subscription of (subscriptionRows ?? []) as any[]) {
    if (!latestSubscription.has(subscription.company_id)) latestSubscription.set(subscription.company_id, subscription);
  }
  const latestPayment = new Map<string, any>();
  for (const payment of (paymentRows ?? []) as any[]) {
    if (!latestPayment.has(payment.company_id)) latestPayment.set(payment.company_id, payment);
  }

  const companies: AdminCompany[] = companiesBase.map((company) => {
    const owner = owners.get(company.id);
    const subscription = latestSubscription.get(company.id);
    const payment = latestPayment.get(company.id);

    return {
      ...company,
      owner_name: owner?.name ?? "Nicht hinterlegt",
      owner_email: owner?.email ?? company.email ?? null,
      subscription_status: subscription?.status ?? null,
      subscription_package: subscription?.package_id ?? null,
      subscription_total: subscription?.total_amount ? Number(subscription.total_amount) : null,
      last_payment_status: payment?.status ?? null,
      last_payment_amount: payment?.amount ? Number(payment.amount) : null,
      last_payment_marked_at: payment?.marked_at ?? null,
    };
  });

  const users: AdminUser[] = profiles.map((profile) => ({
    id: profile.id,
    company_id: profile.company_id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    created_at: profile.created_at,
    company_name: profile.company_id ? companyNames.get(profile.company_id) ?? null : null,
  }));

  const repliesByRequest = new Map<string, { id: string; body: string; created_at: string }[]>();
  for (const reply of (replyRows ?? []) as any[]) {
    const current = repliesByRequest.get(reply.support_request_id) ?? [];
    current.push({ id: reply.id, body: reply.body, created_at: reply.created_at });
    repliesByRequest.set(reply.support_request_id, current);
  }

  const supportRequests: SupportRequest[] = ((supportRows ?? []) as any[]).map((request) => ({
    id: request.id,
    company_id: request.company_id,
    company_name: request.company_id ? companyNames.get(request.company_id) ?? null : null,
    name: request.name,
    email: request.email,
    subject: request.subject,
    message: request.message,
    status: request.status,
    created_at: request.created_at,
    replies: repliesByRequest.get(request.id) ?? [],
  }));

  const logs: AdminLog[] = ((logRows ?? []) as any[]).map((log) => ({
    id: log.id,
    company_id: log.company_id,
    company_name: log.company_id ? companyNames.get(log.company_id) ?? null : null,
    admin_user_id: log.admin_user_id,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id,
    metadata: log.metadata ?? {},
    created_at: log.created_at,
  }));

  const today = startOfToday();
  const stats = {
    totalCompanies: companies.length,
    newRegistrations: companies.filter((company) => company.created_at >= today).length,
    activeCompanies: companies.filter((company) => company.status === "active" && company.subscription_status === "active").length,
    openPayments: companies.filter((company) => company.payment_status === "pending_payment" || company.last_payment_status === "pending").length,
    markedPayments: companies.filter((company) => company.payment_status === "payment_marked_as_sent" || company.last_payment_status === "marked_as_sent").length,
    lockedAccounts: companies.filter((company) => company.status === "locked" || company.payment_status === "locked" || company.subscription_status === "locked").length,
    newSupport: supportRequests.filter((request) => request.status === "open").length,
    systemEvents: logs.length,
  };

  return { adminUserId, companies, users, supportRequests, logs, stats };
}

export function resolveNuriaAdminSection(slug?: string[]): NuriaAdminSection {
  const key = slug?.[0] ?? "";
  switch (key) {
    case "":
      return "overview";
    case "pflegedienste":
      return "companies";
    case "registrierungen":
      return "registrations";
    case "zahlungen":
      return "payments";
    case "tarife":
      return "plans";
    case "nutzer":
      return "users";
    case "support":
      return "support";
    case "systemlogs":
      return "logs";
    case "einstellungen":
      return "settings";
    default:
      notFound();
  }
}
