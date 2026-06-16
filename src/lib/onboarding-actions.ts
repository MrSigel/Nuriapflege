"use server";

import { revalidatePath } from "next/cache";
import { calculatePlan, plans, type BillingInterval } from "@/lib/payment";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { companyId, userId } from "@/lib/onboarding";

type ActionResult = { ok: boolean; message?: string; purpose?: string };

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function required(formData: FormData, key: string) {
  const text = value(formData, key);
  if (!text) throw new Error("Pflichtfeld fehlt.");
  return text;
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

function ok(extra: Partial<ActionResult> = {}): ActionResult {
  return { ok: true, ...extra };
}

function currentPeriodEnd(interval: BillingInterval) {
  const end = new Date();
  end.setMonth(end.getMonth() + plans[interval].months);
  return end.toISOString().slice(0, 10);
}

function normalizeInterval(raw: string | null): BillingInterval | null {
  return raw && raw in plans ? raw as BillingInterval : null;
}

export async function saveOnboardingCompany(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  const uid = userId();
  if (!supabase || !cid) return fail("Onboarding ist aktuell nicht verfügbar.");

  let email: string;
  try {
    email = required(formData, "email");
  } catch {
    return fail("Bitte füllen Sie alle Pflichtfelder aus.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("E-Mail ist ungültig.");

  try {
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        name: required(formData, "name"),
        email,
        billing_email: email,
        phone: required(formData, "phone"),
        street: required(formData, "street"),
        house_number: required(formData, "house_number"),
        postal_code: required(formData, "postal_code"),
        city: required(formData, "city"),
        ik_number: value(formData, "ik_number"),
        onboarding_status: "in_progress",
      })
      .eq("id", cid);
    if (companyError) return fail("Unternehmensdaten konnten nicht gespeichert werden.");

    if (uid) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ first_name: required(formData, "first_name"), last_name: required(formData, "last_name"), email })
        .eq("id", uid)
        .eq("company_id", cid);
      if (profileError) return fail("Inhaber-Daten konnten nicht gespeichert werden.");
    }
  } catch {
    return fail("Bitte füllen Sie alle Pflichtfelder aus.");
  }

  revalidatePath("/dashboard/onboarding");
  return ok();
}

export async function saveOnboardingLocation(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  if (!supabase || !cid) return fail("Onboarding ist aktuell nicht verfügbar.");

  let payload;
  try {
    payload = {
      company_id: cid,
      name: required(formData, "name"),
      street: required(formData, "street"),
      house_number: required(formData, "house_number"),
      postal_code: required(formData, "postal_code"),
      city: required(formData, "city"),
      phone: required(formData, "phone"),
      contact_person: value(formData, "contact_person"),
      location_type: "hauptstandort",
      is_primary: true,
      status: "active",
    };
  } catch {
    return fail("Bitte füllen Sie alle Pflichtfelder aus.");
  }

  const existingId = value(formData, "id");
  let error: { message: string } | null = null;
  if (existingId) {
    error = (await supabase.from("company_locations").update(payload).eq("id", existingId).eq("company_id", cid)).error;
  } else {
    const { data: existing } = await supabase.from("company_locations").select("id").eq("company_id", cid).eq("is_primary", true).maybeSingle();
    if (existing?.id) {
      error = (await supabase.from("company_locations").update(payload).eq("id", existing.id).eq("company_id", cid)).error;
    } else {
      error = (await supabase.from("company_locations").insert(payload)).error;
    }
  }

  if (error) return fail("Standort konnte nicht gespeichert werden.");
  revalidatePath("/dashboard/onboarding");
  return ok();
}

export async function selectOnboardingPlan(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  if (!supabase || !cid) return fail("Onboarding ist aktuell nicht verfügbar.");

  const interval = normalizeInterval(value(formData, "billing_interval"));
  if (!interval) return fail("Tarif ist ungültig.");

  const plan = calculatePlan(interval);
  const nowDate = new Date().toISOString().slice(0, 10);

  const { error: companyError } = await supabase.from("companies").update({ package_id: plan.packageId, billing_interval: interval }).eq("id", cid);
  if (companyError) return fail("Tarif konnte nicht gespeichert werden.");

  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("id")
    .eq("company_id", cid)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionPayload = {
    company_id: cid,
    package_id: plan.packageId,
    package_name: "Nuria Pflege Start",
    monthly_price: plan.monthlyPrice,
    billing_interval: interval,
    discount_percent: plan.discount,
    subtotal_amount: plan.subtotal,
    total_amount: plan.total,
    currency: "EUR",
    status: "pending",
    current_period_start: nowDate,
    current_period_end: currentPeriodEnd(interval),
  };

  const subResult = subscription?.id
    ? await supabase.from("company_subscriptions").update(subscriptionPayload).eq("id", subscription.id).eq("company_id", cid).select("id").single()
    : await supabase.from("company_subscriptions").insert(subscriptionPayload).select("id").single();
  if (subResult.error || !subResult.data?.id) return fail("Subscription konnte nicht gespeichert werden.");

  const { data: existingLog } = await supabase
    .from("company_payment_logs")
    .select("id")
    .eq("company_id", cid)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const logPayload = {
    company_id: cid,
    subscription_id: subResult.data.id,
    amount: plan.total,
    currency: "EUR",
    billing_interval: interval,
    payment_method: "bank_transfer",
    status: "pending",
    notes: "Tarif im Onboarding ausgewählt. Zahlung per Banküberweisung ausstehend.",
  };

  const logResult = existingLog?.id
    ? await supabase.from("company_payment_logs").update(logPayload).eq("id", existingLog.id).eq("company_id", cid).select("id").single()
    : await supabase.from("company_payment_logs").insert(logPayload).select("id").single();
  if (logResult.error || !logResult.data?.id) return fail("Payment-Datensatz konnte nicht gespeichert werden.");

  revalidatePath("/dashboard/onboarding");
  return ok({ purpose: `NURIA-${cid}-${logResult.data.id}` });
}

export async function confirmOnboardingPayment(formData: FormData): Promise<ActionResult> {
  if (formData.get("payment_confirmed") !== "on") return fail("Bitte bestätigen Sie die Zahlung.");

  const supabase = getSupabaseServerClient();
  const cid = companyId();
  const uid = userId();
  if (!supabase || !cid) return fail("Onboarding ist aktuell nicht verfügbar.");

  const interval = normalizeInterval(value(formData, "billing_interval")) ?? "monthly";
  const fallbackPlan = calculatePlan(interval);
  const now = new Date();
  const due = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const dueIso = due.toISOString();

  let { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("id,total_amount,billing_interval,package_id")
    .eq("company_id", cid)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription?.id) {
    const created = await supabase
      .from("company_subscriptions")
      .insert({
        company_id: cid,
        package_id: fallbackPlan.packageId,
        package_name: "Nuria Pflege Start",
        monthly_price: fallbackPlan.monthlyPrice,
        billing_interval: fallbackPlan.billing_interval,
        discount_percent: fallbackPlan.discount,
        subtotal_amount: fallbackPlan.subtotal,
        total_amount: fallbackPlan.total,
        currency: "EUR",
        status: "pending",
        current_period_start: now.toISOString().slice(0, 10),
        current_period_end: currentPeriodEnd(fallbackPlan.billing_interval),
      })
      .select("id,total_amount,billing_interval,package_id")
      .single();
    if (created.error || !created.data) return fail("Tarif konnte nicht gefunden werden.");
    subscription = created.data;
  }

  const { data: pendingLog } = await supabase
    .from("company_payment_logs")
    .select("id")
    .eq("company_id", cid)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let paymentLogId = pendingLog?.id ?? null;
  if (!paymentLogId) {
    const createdLog = await supabase
      .from("company_payment_logs")
      .insert({
        company_id: cid,
        subscription_id: subscription.id,
        amount: Number(subscription.total_amount ?? fallbackPlan.total),
        currency: "EUR",
        billing_interval: subscription.billing_interval,
        payment_method: "bank_transfer",
        status: "pending",
        notes: "Payment-Datensatz im Onboarding erstellt.",
      })
      .select("id")
      .single();
    if (createdLog.error || !createdLog.data?.id) return fail("Payment-Datensatz konnte nicht erstellt werden.");
    paymentLogId = createdLog.data.id;
  }

  const { error: companyError } = await supabase
    .from("companies")
    .update({
      onboarding_status: "completed",
      payment_status: "payment_marked_as_sent",
      package_id: subscription.package_id,
      billing_interval: subscription.billing_interval,
      payment_marked_at: nowIso,
      payment_due_until: dueIso,
      payment_due_check_at: dueIso,
    })
    .eq("id", cid);
  if (companyError) return fail("Zahlung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.");

  const { error: subError } = await supabase.from("company_subscriptions").update({ status: "payment_marked_as_sent" }).eq("id", subscription.id).eq("company_id", cid);
  if (subError) return fail("Zahlung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.");

  const { error: logError } = await supabase
    .from("company_payment_logs")
    .update({ status: "marked_as_sent", marked_by: uid, marked_at: nowIso, notes: "Zahlung im Onboarding als ausgeführt bestätigt." })
    .eq("id", paymentLogId)
    .eq("company_id", cid);
  if (logError) return fail("Zahlung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/onboarding");
  return ok();
}
