"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { writeActivityLog } from "@/lib/activity-log-actions";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { ExportFormat, ExportType } from "@/lib/exports";

const types = ["clients", "employees", "locations", "shifts", "tours", "time_entries", "care_documentation", "documents_metadata", "billing", "applicants", "website_online", "qm_md", "activity_logs"] as const;
const formats = ["csv", "json"] as const;
const tableMap: Record<ExportType, string[]> = {
  clients: ["clients"],
  employees: ["profiles"],
  locations: ["company_locations"],
  shifts: ["shifts"],
  tours: ["tours", "tour_stops"],
  time_entries: ["time_entries"],
  care_documentation: ["care_documentation"],
  documents_metadata: ["documents"],
  billing: ["billing_items", "invoices", "invoice_items"],
  applicants: ["applicants"],
  website_online: ["website_leads", "online_presence_tasks"],
  qm_md: ["qm_items", "qm_measures", "qm_evidence"],
  activity_logs: ["activity_logs"],
};

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const keys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row ?? {}).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );
  return [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
}

async function load(supabase: any, companyId: string, type: ExportType, from: string | null, to: string | null) {
  const out: Record<string, unknown[]> = {};
  for (const table of tableMap[type]) {
    let query = supabase.from(table).select("*").eq("company_id", companyId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    out[table] = data ?? [];
  }
  return out;
}

async function context() {
  return requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
}

export async function createExportJob(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  if (!supabase || !companyId) return;

  const exportType = required(formData, "export_type") as ExportType;
  const format = required(formData, "format") as ExportFormat;
  if (!types.includes(exportType)) throw new Error("Exportbereich ist ungueltig.");
  if (!formats.includes(format as "csv" | "json")) throw new Error("PDF-Export wird vorbereitet.");

  const dateFrom = text(formData.get("date_from"));
  const dateTo = text(formData.get("date_to"));
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) throw new Error("Zeitraum ist ungueltig.");

  const requestedName = text(formData.get("file_name"));
  const { data: job, error } = await supabase
    .from("export_jobs")
    .insert({ company_id: companyId, requested_by: userId, export_type: exportType, format, status: "processing", date_from: dateFrom, date_to: dateTo, filters: {} })
    .select("id")
    .single();
  if (error || !job) throw new Error(error?.message ?? "Export konnte nicht erstellt werden.");

  await writeActivityLog({ companyId, userId, action: "created", entityType: "export_job", entityId: job.id, entityLabel: exportType, message: "Exportauftrag wurde erstellt.", status: "pending" });

  try {
    const rows = await load(supabase, companyId, exportType, dateFrom, dateTo);
    const body = format === "json" ? JSON.stringify(rows, null, 2) : Object.entries(rows).map(([table, data]) => `# ${table}\n${csv(data as any[])}`).join("\n\n");
    const fileName = safeName(requestedName || `${exportType}-${new Date().toISOString().slice(0, 10)}.${format}`);
    const path = `${companyId}/${job.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("company-exports").upload(path, body, { contentType: format === "json" ? "application/json" : "text/csv", upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    await supabase
      .from("export_jobs")
      .update({ status: "completed", file_name: fileName, file_path: path, file_size: new TextEncoder().encode(body).length, storage_bucket: "company-exports", completed_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("company_id", companyId);
    await writeActivityLog({ companyId, userId, action: "exported", entityType: "export_job", entityId: job.id, entityLabel: fileName, message: "Exportdatei wurde erstellt.", metadata: { export_type: exportType, format } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export fehlgeschlagen";
    await supabase.from("export_jobs").update({ status: "failed", error_message: message }).eq("id", job.id).eq("company_id", companyId);
    await writeActivityLog({ companyId, userId, action: "error", entityType: "export_job", entityId: job.id, entityLabel: exportType, severity: "error", status: "failed", message });
  }

  revalidatePath("/dashboard/exporte");
  revalidatePath("/dashboard/aktivitaeten");
}

export async function deleteExportJob(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "id");
  if (!supabase || !companyId) return;

  await supabase.from("export_jobs").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId);
  await writeActivityLog({ companyId, userId, action: "deleted", entityType: "export_job", entityId: id, message: "Exportauftrag wurde in den Papierkorb verschoben." });
  revalidatePath("/dashboard/exporte");
  revalidatePath("/dashboard/aktivitaeten");
}
