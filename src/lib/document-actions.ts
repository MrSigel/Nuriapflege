"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const bucket = "company-documents";
const allowed = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const max = 20 * 1024 * 1024;

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

async function own(table: string, companyId: string, id: string | null) {
  if (!id) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from(table).select("id").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Zuweisung ist ungueltig.");
  return id;
}

async function audit(companyId: string, userId: string, id: string, action: string, row: unknown) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("document_audit_logs").insert({
    company_id: companyId,
    document_id: id,
    changed_by: userId,
    action,
    new_values: row,
  });
}

async function meta(formData: FormData, companyId: string) {
  return {
    title: required(formData, "title"),
    description: text(formData.get("description")),
    category: required(formData, "category"),
    visibility: required(formData, "visibility"),
    status: required(formData, "status"),
    client_id: await own("clients", companyId, text(formData.get("client_id"))),
    employee_id: await own("profiles", companyId, text(formData.get("employee_id"))),
    shift_id: await own("shifts", companyId, text(formData.get("shift_id"))),
    tour_id: await own("tours", companyId, text(formData.get("tour_id"))),
    tour_stop_id: await own("tour_stops", companyId, text(formData.get("tour_stop_id"))),
    invoice_id: await own("invoices", companyId, text(formData.get("invoice_id"))),
    billing_item_id: await own("billing_items", companyId, text(formData.get("billing_item_id"))),
  };
}

async function context() {
  return requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
}

export async function uploadDocument(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Datei fehlt.");
  if (file.size > max) throw new Error("Datei ist zu gross.");
  if (!allowed.includes(file.type)) throw new Error("Dateityp ist nicht erlaubt.");

  const id = randomUUID();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/${id}/${safe}`;
  const upload = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) throw upload.error;

  const row = {
    ...(await meta(formData, companyId)),
    id,
    company_id: companyId,
    uploaded_by: userId,
    file_name: file.name,
    file_path: path,
    file_type: safe.split(".").pop()?.toLowerCase() ?? null,
    mime_type: file.type,
    file_size: file.size,
    storage_bucket: bucket,
    uploaded_at: new Date().toISOString(),
  };

  await supabase.from("documents").insert(row);
  await audit(companyId, userId, id, "uploaded", row);
  revalidatePath("/dashboard/dokumente");
}

export async function updateDocument(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  const row = await meta(formData, companyId);
  await supabase.from("documents").update(row).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, id, "updated", row);
  revalidatePath("/dashboard/dokumente");
}

export async function archiveDocument(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase.from("documents").update({ status: "archived" }).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, id, "archived", { status: "archived" });
  revalidatePath("/dashboard/dokumente");
}

export async function deleteDocument(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase
    .from("documents")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
  await audit(companyId, userId, id, "deleted", { status: "deleted" });
  revalidatePath("/dashboard/dokumente");
}

export async function getDocumentSignedUrl(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return null;

  const { data } = await supabase
    .from("documents")
    .select("file_path, storage_bucket, mime_type")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!data?.file_path) return null;

  const signed = await supabase.storage.from(data.storage_bucket ?? bucket).createSignedUrl(data.file_path, 300);
  if (signed.error) return null;

  await audit(companyId, userId, id, "downloaded", { id });
  return { url: signed.data.signedUrl, mimeType: data.mime_type };
}
