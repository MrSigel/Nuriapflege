"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

async function own(table: string, companyId: string, id: string | null, isRequired = false) {
  if (!id) {
    if (isRequired) throw new Error("Pflichtfeld fehlt.");
    return null;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Zuweisung ist ungueltig.");
  return id;
}

async function audit(companyId: string, userId: string, type: string, id: string, action: string, row: unknown) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("billing_audit_logs").insert({
    company_id: companyId,
    record_type: type,
    record_id: id,
    changed_by: userId,
    action,
    new_values: row,
  });
}

async function itemPayload(formData: FormData, companyId: string) {
  const quantity = Number(required(formData, "quantity"));
  const unitPrice = Number(required(formData, "unit_price"));
  if (quantity <= 0) throw new Error("Menge ist ungueltig.");
  if (unitPrice < 0) throw new Error("Einzelpreis ist ungueltig.");

  return {
    client_id: await own("clients", companyId, required(formData, "client_id"), true),
    employee_id: await own("profiles", companyId, text(formData.get("employee_id"))),
    shift_id: await own("shifts", companyId, text(formData.get("shift_id"))),
    tour_id: await own("tours", companyId, text(formData.get("tour_id"))),
    tour_stop_id: await own("tour_stops", companyId, text(formData.get("tour_stop_id"))),
    time_entry_id: await own("time_entries", companyId, text(formData.get("time_entry_id"))),
    service_date: required(formData, "service_date"),
    service_type: required(formData, "service_type"),
    description: required(formData, "description"),
    quantity,
    unit: required(formData, "unit"),
    unit_price: unitPrice,
    total_amount: quantity * unitPrice,
    payer_type: required(formData, "payer_type"),
    payer_name: text(formData.get("payer_name")),
    status: required(formData, "status"),
    notes: text(formData.get("notes")),
  };
}

async function context() {
  return requireCompanyRole(["inhaber", "verwaltung"]);
}

export async function createBillingItem(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const row = { ...(await itemPayload(formData, companyId)), company_id: companyId, created_by: userId, updated_by: userId };
  const { data } = await supabase.from("billing_items").insert(row).select("id").single();
  if (data) await audit(companyId, userId, "billing_item", data.id, "created", row);
  revalidatePath("/dashboard/abrechnung");
}

export async function updateBillingItem(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  const row = { ...(await itemPayload(formData, companyId)), updated_by: userId };
  await supabase.from("billing_items").update(row).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, "billing_item", id, "updated", row);
  revalidatePath("/dashboard/abrechnung");
}

export async function changeBillingItemStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const status = required(formData, "status");
  if (!supabase || !companyId) return;

  await supabase.from("billing_items").update({ status, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, "billing_item", id, status, { status });
  revalidatePath("/dashboard/abrechnung");
}

export async function createInvoice(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const clientId = await own("clients", companyId, required(formData, "client_id"), true);
  const start = required(formData, "billing_period_start");
  const end = required(formData, "billing_period_end");
  const { data: items } = await supabase
    .from("billing_items")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("status", "ready")
    .gte("service_date", start)
    .lte("service_date", end);
  const rows = items ?? [];
  const subtotal = rows.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0);
  const invoice = {
    company_id: companyId,
    client_id: clientId,
    invoice_number: `RE-${Date.now()}`,
    invoice_date: new Date().toISOString().slice(0, 10),
    billing_period_start: start,
    billing_period_end: end,
    due_date: text(formData.get("due_date")),
    recipient_name: required(formData, "recipient_name"),
    recipient_email: text(formData.get("recipient_email")),
    recipient_address: text(formData.get("recipient_address")),
    subtotal_amount: subtotal,
    tax_amount: 0,
    total_amount: subtotal,
    status: "draft",
    payment_status: "open",
    notes: text(formData.get("notes")),
    created_by: userId,
    updated_by: userId,
  };

  const { data } = await supabase.from("invoices").insert(invoice).select("id").single();
  if (data && rows.length) {
    await supabase.from("invoice_items").insert(
      rows.map((item) => ({
        company_id: companyId,
        invoice_id: data.id,
        billing_item_id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
      })),
    );
    await supabase.from("billing_items").update({ status: "billed", updated_by: userId }).eq("company_id", companyId).in("id", rows.map((item) => item.id));
    await audit(companyId, userId, "invoice", data.id, "created", invoice);
  }
  revalidatePath("/dashboard/abrechnung");
}

export async function updateInvoiceStatus(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  const field = required(formData, "field");
  const value = required(formData, "value");
  if (!supabase || !companyId) return;

  await supabase.from("invoices").update({ [field]: value, updated_by: userId }).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, "invoice", id, value, { [field]: value });
  revalidatePath("/dashboard/abrechnung");
}
