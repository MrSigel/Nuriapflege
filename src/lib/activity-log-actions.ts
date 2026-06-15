"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

type LogPayload = {
  companyId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  severity?: "info" | "warning" | "error" | "critical";
  status?: "success" | "failed" | "pending";
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function writeActivityLog(payload: LogPayload) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  let actorName: string | null = null;
  let actorRole: string | null = null;

  if (payload.userId) {
    const { data } = await supabase.from("profiles").select("first_name,last_name,email,role").eq("id", payload.userId).maybeSingle();
    actorName = [data?.first_name, data?.last_name].filter(Boolean).join(" ") || data?.email || null;
    actorRole = data?.role ?? null;
  }

  await supabase.from("activity_logs").insert({
    company_id: payload.companyId,
    user_id: payload.userId ?? null,
    actor_name: actorName,
    actor_role: actorRole,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    entity_label: payload.entityLabel ?? null,
    severity: payload.severity ?? "info",
    status: payload.status ?? "success",
    message: payload.message ?? null,
    metadata: payload.metadata ?? null,
  });
}
