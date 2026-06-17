import { getCurrentUserContext } from "@/lib/current-user";
import { calculatePlan, intervalFromPackage, monthlyPrice, plans, type BillingInterval, type PaymentCompany, type PaymentData, type PaymentLog, type Subscription } from "@/lib/payment";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function userName(row: { first_name?: string | null; last_name?: string | null; email?: string | null }) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Nicht hinterlegt";
}

export async function getPaymentData(): Promise<PaymentData> {
  const supabase = getSupabaseServerClient();
  const context = await getCurrentUserContext();
  const companyId = context?.companyId ?? null;
  const empty = {
    company: null,
    subscription: null,
    logs: [],
    bank: { recipient: "Enrico Gross", iban: "DE17100101788022253533", bic: "REVODEB2", bank: "Revolut", purpose: "" },
    stats: {
      status: "Nicht hinterlegt",
      packageId: "Nicht hinterlegt",
      interval: "Nicht hinterlegt",
      nextCheck: "Nicht hinterlegt",
      amount: 0,
      lastMarked: "Nicht hinterlegt",
    },
  };

  if (!supabase || !companyId) return empty;

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,legal_name,email,billing_email,street,house_number,postal_code,city,country,payment_status,package_id,billing_interval,payment_marked_at,payment_due_until,payment_due_check_at,admin_confirmed_at,locked_at,created_at,updated_at")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) return empty;

  const interval = intervalFromPackage(company.package_id, company.billing_interval);
  const plan = calculatePlan(interval);
  let { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.months);
    const inserted = await supabase
      .from("company_subscriptions")
      .insert({
        company_id: companyId,
        package_id: company.package_id ?? plan.packageId,
        package_name: "Nuria Pflege Start",
        monthly_price: monthlyPrice,
        billing_interval: interval,
        discount_percent: plan.discount,
        subtotal_amount: plan.subtotal,
        total_amount: plan.total,
        currency: "EUR",
        status: company.payment_status === "active" ? "active" : company.payment_status === "payment_marked_as_sent" ? "payment_marked_as_sent" : "pending",
        current_period_start: start.toISOString().slice(0, 10),
        current_period_end: end.toISOString().slice(0, 10),
      })
      .select("*")
      .single();
    subscription = inserted.data;
  }

  const { data: logs } = await supabase
    .from("company_payment_logs")
    .select("*, profiles(first_name,last_name,email)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  const normalizedLogs = ((logs ?? []) as any[]).map((log) => ({
    ...log,
    marked_by_name: Array.isArray(log.profiles) ? userName(log.profiles[0] ?? {}) : userName(log.profiles ?? {}),
  })) as PaymentLog[];
  const paymentId = normalizedLogs[0]?.id ?? subscription?.id ?? "OFFEN";
  const purpose = `NURIA-${company.id}-${paymentId}`;
  const activeInterval = (subscription?.billing_interval ?? interval) as BillingInterval;

  return {
    company: company as PaymentCompany,
    subscription: subscription as Subscription | null,
    logs: normalizedLogs,
    bank: { recipient: "Enrico Gross", iban: "DE17100101788022253533", bic: "REVODEB2", bank: "Revolut", purpose },
    stats: {
      status: company.payment_status ?? "pending_payment",
      packageId: subscription?.package_id ?? company.package_id ?? plan.packageId,
      interval: plans[activeInterval].label,
      nextCheck: company.payment_due_until ?? company.payment_due_check_at ?? "Nicht hinterlegt",
      amount: Number(subscription?.total_amount ?? plan.total),
      lastMarked: company.payment_marked_at ?? "Nicht hinterlegt",
    },
  };
}
