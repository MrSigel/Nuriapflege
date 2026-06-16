"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculatePlan, plans, type BillingInterval } from "@/lib/payment";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { companyId, userId } from "@/lib/onboarding";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function required(formData: FormData, key: string) {
  const text = value(formData, key);
  if (!text) throw new Error("Pflichtfeld fehlt.");
  return text;
}

function currentPeriodEnd(interval: BillingInterval) {
  const end = new Date();
  end.setMonth(end.getMonth() + plans[interval].months);
  return end.toISOString().slice(0, 10);
}

export async function saveOnboardingCompany(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  const uid = userId();
  if (!supabase || !cid) return;

  const email = required(formData, "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-Mail ist ungültig.");

  await supabase
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

  if (uid) {
    await supabase
      .from("profiles")
      .update({ first_name: required(formData, "first_name"), last_name: required(formData, "last_name"), email })
      .eq("id", uid)
      .eq("company_id", cid);
  }

  revalidatePath("/dashboard/onboarding");
}

export async function saveOnboardingLocation(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  if (!supabase || !cid) return;

  const payload = {
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

  const existingId = value(formData, "id");
  if (existingId) {
    await supabase.from("company_locations").update(payload).eq("id", existingId).eq("company_id", cid);
  } else {
    const { data: existing } = await supabase.from("company_locations").select("id").eq("company_id", cid).eq("is_primary", true).maybeSingle();
    if (existing?.id) {
      await supabase.from("company_locations").update(payload).eq("id", existing.id).eq("company_id", cid);
    } else {
      await supabase.from("company_locations").insert(payload);
    }
  }

  revalidatePath("/dashboard/onboarding");
}

export async function selectOnboardingPlan(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  if (!supabase || !cid) return;

  const interval = required(formData, "billing_interval") as BillingInterval;
  if (!(interval in plans)) throw new Error("Tarif ist ungültig.");

  const plan = calculatePlan(interval);
  const nowDate = new Date().toISOString().slice(0, 10);

  await supabase.from("companies").update({ package_id: plan.packageId, billing_interval: interval }).eq("id", cid);

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

  const subId = subscription?.id
    ? (await supabase.from("company_subscriptions").update(subscriptionPayload).eq("id", subscription.id).eq("company_id", cid).select("id").single()).data?.id
    : (await supabase.from("company_subscriptions").insert(subscriptionPayload).select("id").single()).data?.id;

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
    subscription_id: subId ?? null,
    amount: plan.total,
    currency: "EUR",
    billing_interval: interval,
    payment_method: "bank_transfer",
    status: "pending",
    notes: "Tarif im Onboarding ausgewählt. Zahlung per Banküberweisung ausstehend.",
  };

  if (existingLog?.id) {
    await supabase.from("company_payment_logs").update(logPayload).eq("id", existingLog.id).eq("company_id", cid);
  } else {
    await supabase.from("company_payment_logs").insert(logPayload);
  }

  revalidatePath("/dashboard/onboarding");
}

export async function confirmOnboardingPayment(formData: FormData) {
  if (formData.get("payment_confirmed") !== "on") throw new Error("Bitte bestätigen Sie die Zahlung.");

  const supabase = getSupabaseServerClient();
  const cid = companyId();
  const uid = userId();
  if (!supabase || !cid) return;

  const now = new Date();
  const due = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const dueIso = due.toISOString();

  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("id,total_amount,billing_interval")
    .eq("company_id", cid)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from("companies")
    .update({
      onboarding_status: "completed",
      payment_status: "payment_marked_as_sent",
      payment_marked_at: nowIso,
      payment_due_until: dueIso,
      payment_due_check_at: dueIso,
    })
    .eq("id", cid);

  if (subscription?.id) {
    await supabase.from("company_subscriptions").update({ status: "payment_marked_as_sent" }).eq("id", subscription.id).eq("company_id", cid);
  }

  const { data: pendingLog } = await supabase
    .from("company_payment_logs")
    .select("id")
    .eq("company_id", cid)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingLog?.id) {
    await supabase
      .from("company_payment_logs")
      .update({ status: "marked_as_sent", marked_by: uid, marked_at: nowIso, notes: "Zahlung im Onboarding als ausgeführt bestätigt." })
      .eq("id", pendingLog.id)
      .eq("company_id", cid);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
