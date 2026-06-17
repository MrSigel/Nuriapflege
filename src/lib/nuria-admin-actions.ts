"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireNuriaAdmin } from "@/lib/nuria-admin";

type AdminLogPayload = {
  companyId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function writeAdminLog(adminUserId: string | null, payload: AdminLogPayload) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("admin_logs").insert({
    company_id: payload.companyId ?? null,
    admin_user_id: adminUserId,
    action: payload.action,
    target_type: payload.targetType,
    target_id: payload.targetId ?? null,
    metadata: payload.metadata ?? {},
  });
}

async function latestSubscriptionId(companyId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("company_subscriptions")
    .select("id")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function confirmCompanyPayment(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const companyId = text(formData.get("company_id"));
  if (!supabase || !companyId) return;

  await supabase
    .from("companies")
    .update({
      payment_status: "active",
      status: "active",
      admin_confirmed_at: new Date().toISOString(),
      confirmed_by: adminUserId,
      locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  await supabase.from("company_subscriptions").update({ status: "active", updated_at: new Date().toISOString() }).eq("company_id", companyId);

  const subscriptionId = await latestSubscriptionId(companyId);
  if (subscriptionId) {
    await supabase
      .from("company_payment_logs")
      .update({ status: "confirmed", confirmed_by: adminUserId, confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("company_id", companyId)
      .eq("subscription_id", subscriptionId);
  }

  await writeAdminLog(adminUserId, { companyId, action: "payment_confirmed", targetType: "company", targetId: companyId });
  revalidatePath("/nuria-admin");
}

export async function rejectCompanyPayment(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const companyId = text(formData.get("company_id"));
  const note = text(formData.get("note"));
  if (!supabase || !companyId) return;

  await supabase.from("companies").update({ payment_status: "pending_payment", updated_at: new Date().toISOString() }).eq("id", companyId);
  await supabase.from("company_subscriptions").update({ status: "pending", updated_at: new Date().toISOString() }).eq("company_id", companyId);
  await supabase
    .from("company_payment_logs")
    .update({ status: "rejected", notes: note, updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .in("status", ["pending", "marked_as_sent"]);

  await writeAdminLog(adminUserId, { companyId, action: "payment_rejected", targetType: "company", targetId: companyId, metadata: { note } });
  revalidatePath("/nuria-admin");
}

export async function markCompanyPaymentOpen(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const companyId = text(formData.get("company_id"));
  if (!supabase || !companyId) return;

  await supabase.from("companies").update({ payment_status: "pending_payment", updated_at: new Date().toISOString() }).eq("id", companyId);
  await supabase.from("company_subscriptions").update({ status: "pending", updated_at: new Date().toISOString() }).eq("company_id", companyId);
  await writeAdminLog(adminUserId, { companyId, action: "payment_marked_open", targetType: "company", targetId: companyId });
  revalidatePath("/nuria-admin");
}

export async function lockCompanyAccount(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const companyId = text(formData.get("company_id"));
  if (!supabase || !companyId) return;

  await supabase
    .from("companies")
    .update({ status: "locked", payment_status: "locked", locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", companyId);
  await supabase.from("company_subscriptions").update({ status: "locked", updated_at: new Date().toISOString() }).eq("company_id", companyId);
  await writeAdminLog(adminUserId, { companyId, action: "account_locked", targetType: "company", targetId: companyId });
  revalidatePath("/nuria-admin");
}

export async function unlockCompanyAccount(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const companyId = text(formData.get("company_id"));
  if (!supabase || !companyId) return;

  await supabase
    .from("companies")
    .update({ status: "active", payment_status: "active", locked_at: null, updated_at: new Date().toISOString() })
    .eq("id", companyId);
  await supabase.from("company_subscriptions").update({ status: "active", updated_at: new Date().toISOString() }).eq("company_id", companyId);
  await writeAdminLog(adminUserId, { companyId, action: "account_unlocked", targetType: "company", targetId: companyId });
  revalidatePath("/nuria-admin");
}

export async function updateSupportStatus(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const requestId = text(formData.get("request_id"));
  const status = text(formData.get("status"));
  if (!supabase || !requestId || !status) return;

  await supabase.from("support_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", requestId);
  await writeAdminLog(adminUserId, { action: "support_status_changed", targetType: "support_request", targetId: requestId, metadata: { status } });
  revalidatePath("/nuria-admin/support");
}

export async function createSupportReply(formData: FormData) {
  const adminUserId = await requireNuriaAdmin();
  const supabase = getSupabaseServerClient();
  const requestId = text(formData.get("request_id"));
  const body = text(formData.get("body"));
  if (!supabase || !requestId || !body) return;

  await supabase.from("support_replies").insert({ support_request_id: requestId, admin_user_id: adminUserId, body });
  await supabase.from("support_requests").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", requestId);
  await writeAdminLog(adminUserId, { action: "support_reply_saved", targetType: "support_request", targetId: requestId });
  revalidatePath("/nuria-admin/support");
}
