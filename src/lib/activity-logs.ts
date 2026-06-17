import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentUserContext } from "@/lib/current-user";

export type ActivityLog = {
  id: string;
  company_id: string;
  user_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  severity: "info" | "warning" | "error" | "critical";
  status: "success" | "failed" | "pending";
  message: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type ActivityLogsData = {
  logs: ActivityLog[];
  users: { id: string; name: string }[];
  stats: { total: number; today: number; changes: number; files: number; exports: number; warnings: number; errors: number; security: number };
  exportPrepared: boolean;
};

function name(row: { first_name?: string | null; last_name?: string | null; email?: string | null }) { return [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Nicht hinterlegt"; }

export async function getActivityLogsData(): Promise<ActivityLogsData> {
  const supabase = getSupabaseServerClient();
  const context = await getCurrentUserContext();
  const cid = context?.companyId ?? null;
  const empty = { logs: [], users: [], stats: { total: 0, today: 0, changes: 0, files: 0, exports: 0, warnings: 0, errors: 0, security: 0 }, exportPrepared: true };
  if (!supabase || !cid) return empty;

  const [{ data: logs }, { data: users }] = await Promise.all([
    supabase.from("activity_logs").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id,first_name,last_name,email").eq("company_id", cid).order("last_name"),
  ]);

  const normalized = (logs ?? []) as ActivityLog[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fileActions = ["uploaded", "downloaded", "deleted", "archived"];
  const changeActions = ["created", "updated", "status_changed", "archived", "deleted", "completed"];
  const securityActions = ["login", "logout", "failed_login", "role_changed", "permission_changed"];

  return {
    logs: normalized,
    users: ((users ?? []) as any[]).map((user) => ({ id: user.id, name: name(user) })),
    stats: {
      total: normalized.length,
      today: normalized.filter((log) => new Date(log.created_at) >= today).length,
      changes: normalized.filter((log) => changeActions.includes(log.action)).length,
      files: normalized.filter((log) => fileActions.includes(log.action) && (log.entity_type === "document" || log.entity_type === "export_job")).length,
      exports: normalized.filter((log) => log.entity_type === "export_job" || log.action === "exported").length,
      warnings: normalized.filter((log) => log.severity === "warning").length,
      errors: normalized.filter((log) => log.severity === "error" || log.severity === "critical" || log.status === "failed").length,
      security: normalized.filter((log) => securityActions.includes(log.action)).length,
    },
    exportPrepared: true,
  };
}
