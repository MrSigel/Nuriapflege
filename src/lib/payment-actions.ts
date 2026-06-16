"use server";

import { revalidatePath } from "next/cache";
import { calculatePlan, plans, type BillingInterval } from "@/lib/payment";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { writeActivityLog } from "@/lib/activity-log-actions";

function companyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

function userId() {
  return process.env.NURIA_DEV_USER_ID ?? null;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function email(value: string | null) {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("E-Mail ist ungültig.");
  return value;
}

export async function markPaymentSent() {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  const uid = userId();
  if (!supabase || !cid) return;

  const { data: company } = await supabase.from("companies").select("payment_status,billing_interval,package_id").eq("id", cid).maybeSingle();
  if (!company || company.payment_status === "payment_marked_as_sent" || company.payment_status === "active") return;

  const { data: subscription } = await supabase
    .from("company_subscriptions")
    .select("*")
    .eq("company_id", cid)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const interval = (subscription?.billing_interval ?? company.billing_interval ?? "monthly") as BillingInterval;
  const plan = calculatePlan(interval in plans ? interval : "monthly");
  const now = new Date().toISOString();
  const due = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("companies")
    .update({
      onboarding_status: "completed",
      payment_status: "payment_marked_as_sent",
      payment_marked_at: now,
      payment_due_until: due,
      payment_due_check_at: due,
      package_id: subscription?.package_id ?? company.package_id ?? plan.packageId,
      billing_interval: interval,
    })
    .eq("id", cid);

  if (subscription?.id) {
    await supabase.from("company_subscriptions").update({ status: "payment_marked_as_sent" }).eq("id", subscription.id).eq("company_id", cid);
  }

  await supabase.from("company_payment_logs").insert({
    company_id: cid,
    subscription_id: subscription?.id ?? null,
    amount: Number(subscription?.total_amount ?? plan.total),
    currency: "EUR",
    billing_interval: interval,
    payment_method: "bank_transfer",
    status: "marked_as_sent",
    marked_by: uid,
    marked_at: now,
    notes: "Überweisung als ausgeführt markiert. Die Zahlung wird intern geprüft.",
  });

  await writeActivityLog({
    companyId: cid,
    userId: uid,
    action: "updated",
    entityType: "company_settings",
    entityLabel: "Zahlung & Tarif",
    message: "Überweisung wurde als ausgeführt markiert.",
  });

  revalidatePath("/dashboard/zahlung-tarif");
  revalidatePath("/dashboard");
}

export async function saveBillingData(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const cid = companyId();
  if (!supabase || !cid) return;

  await supabase
    .from("companies")
    .update({
      billing_email: email(text(formData, "billing_email")),
      name: text(formData, "name"),
      legal_name: text(formData, "legal_name"),
      street: text(formData, "street"),
      house_number: text(formData, "house_number"),
      postal_code: text(formData, "postal_code"),
      city: text(formData, "city"),
      country: text(formData, "country"),
    })
    .eq("id", cid);

  await writeActivityLog({
    companyId: cid,
    userId: userId(),
    action: "updated",
    entityType: "company_settings",
    entityLabel: "Rechnungsdaten",
    message: "Rechnungsdaten wurden geändert.",
  });

  revalidatePath("/dashboard/zahlung-tarif");
}
