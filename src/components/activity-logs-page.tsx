"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Download, Eye, FileClock, FilterX, History, LockKeyhole, Search, Settings, ShieldAlert, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityLog, ActivityLogsData } from "@/lib/activity-logs";

type Props = { data: ActivityLogsData };

const actionLabels: Record<string, string> = {
  created: "Erstellt", updated: "Geändert", deleted: "Gelöscht", archived: "Archiviert", restored: "Wiederhergestellt", status_changed: "Status geändert", role_changed: "Rolle geändert", permission_changed: "Recht geändert", uploaded: "Hochgeladen", downloaded: "Heruntergeladen", exported: "Exportiert", login: "Login", logout: "Logout", failed_login: "Fehlgeschlagener Login", viewed: "Angesehen", approved: "Freigegeben", rejected: "Abgelehnt", completed: "Erledigt", error: "Fehler",
};
const entityLabels: Record<string, string> = {
  client: "Klient", employee: "Mitarbeiter", location: "Standort", shift: "Dienst", tour: "Tour", time_entry: "Zeiteintrag", care_documentation: "Pflegedokumentation", document: "Dokument", billing_item: "Abrechnung", invoice: "Rechnung", conversation: "Konversation", message: "Nachricht", applicant: "Bewerber", website_lead: "Website-Anfrage", online_presence_task: "Online-Aufgabe", qm_item: "QM-Prüfpunkt", qm_measure: "QM-Maßnahme", export_job: "Export", role_permission: "Rollen & Rechte", company_settings: "Einstellungen", user_settings: "Nutzereinstellungen", system: "System",
};
const severityLabels = { info: "Info", warning: "Warnung", error: "Fehler", critical: "Kritisch" } as const;
const statusLabels = { success: "Erfolgreich", failed: "Fehlgeschlagen", pending: "Ausstehend" } as const;

function value(v: unknown) { return typeof v === "string" && v.trim() ? v : "Nicht hinterlegt"; }
function formatDate(v: string) { return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(v)); }
function pretty(v: unknown) { if (!v) return "Nicht hinterlegt"; try { return JSON.stringify(v, null, 2); } catch { return String(v); } }

function Detail({ log }: { log: ActivityLog }) {
  return (
    <details>
      <summary><Eye size={15} />Details ansehen</summary>
      <motion.div className="activity-detail-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div><span>Zeitpunkt</span><strong>{formatDate(log.created_at)}</strong></div>
        <div><span>Nutzer / Auslöser</span><strong>{value(log.actor_name)}</strong></div>
        <div><span>Rolle</span><strong>{value(log.actor_role)}</strong></div>
        <div><span>Aktion</span><strong>{actionLabels[log.action] ?? log.action}</strong></div>
        <div><span>Bereich</span><strong>{entityLabels[log.entity_type] ?? log.entity_type}</strong></div>
        <div><span>Objekt-ID</span><strong>{value(log.entity_id)}</strong></div>
        <div><span>Objektbezeichnung</span><strong>{value(log.entity_label)}</strong></div>
        <div><span>Schweregrad</span><strong>{severityLabels[log.severity]}</strong></div>
        <div><span>Status</span><strong>{statusLabels[log.status]}</strong></div>
        <div className="activity-detail-wide"><span>Nachricht</span><strong>{value(log.message)}</strong></div>
        <div className="activity-detail-wide"><span>Metadaten</span><pre>{pretty(log.metadata)}</pre></div>
        <div className="activity-detail-wide"><span>Alte Werte</span><pre>{pretty(log.old_values)}</pre></div>
        <div className="activity-detail-wide"><span>Neue Werte</span><pre>{pretty(log.new_values)}</pre></div>
        <div><span>IP-Adresse</span><strong>{value(log.ip_address)}</strong></div>
        <div><span>User-Agent</span><strong>{value(log.user_agent)}</strong></div>
      </motion.div>
    </details>
  );
}

export function ActivityLogsPage({ data }: Props) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [user, setUser] = useState("all");
  const [role, setRole] = useState("all");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");

  const stats = [["Aktivitäten gesamt", data.stats.total, History], ["Aktivitäten heute", data.stats.today, FileClock], ["Änderungen", data.stats.changes, Settings], ["Uploads / Downloads", data.stats.files, Upload], ["Exporte", data.stats.exports, Download], ["Warnungen", data.stats.warnings, AlertTriangle], ["Fehler", data.stats.errors, ShieldAlert], ["Sicherheitsereignisse", data.stats.security, LockKeyhole]] as const;
  const filtered = useMemo(() => {
    const now = Date.now();
    return data.logs.filter((log) => {
      const hay = [log.actor_name, log.action, log.entity_type, log.entity_label, log.message, actionLabels[log.action], entityLabels[log.entity_type]].filter(Boolean).join(" ").toLowerCase();
      const inTab = tab === "all" || (tab === "changes" && ["created", "updated", "status_changed", "archived", "deleted", "completed"].includes(log.action)) || (tab === "files" && (log.entity_type === "document" || log.entity_type === "export_job" || ["uploaded", "downloaded", "exported"].includes(log.action))) || (tab === "roles" && ["role_changed", "permission_changed"].includes(log.action)) || (tab === "security" && ["login", "logout", "failed_login", "role_changed", "permission_changed"].includes(log.action)) || (tab === "errors" && (log.severity === "error" || log.severity === "critical" || log.status === "failed")) || (tab === "system" && log.entity_type === "system");
      const inPeriod = period === "all" || (period === "today" ? new Date(log.created_at).toDateString() === new Date().toDateString() : new Date(log.created_at).getTime() >= now - Number(period) * 24 * 60 * 60 * 1000);
      return inTab && inPeriod && (!query || hay.includes(query.toLowerCase())) && (user === "all" || log.user_id === user) && (role === "all" || log.actor_role === role) && (action === "all" || log.action === action) && (entity === "all" || log.entity_type === entity) && (severity === "all" || log.severity === severity) && (status === "all" || log.status === status);
    });
  }, [action, data.logs, entity, period, query, role, severity, status, tab, user]);

  function reset() { setQuery(""); setPeriod("all"); setUser("all"); setRole("all"); setAction("all"); setEntity("all"); setSeverity("all"); setStatus("all"); }

  return (
    <motion.section className="page activity-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="activity-header"><div><h1>Aktivitäten / Protokolle</h1><p>Verfolgen Sie Änderungen, Aktivitäten und wichtige Ereignisse innerhalb Ihres Pflegedienstes.</p></div><a className="button secondary" href="/dashboard/exporte" title="Exportbereich activity_logs nutzen"><Download size={16} />Protokolle exportieren</a></div>
      <div className="activity-stats-grid">{stats.map(([label, count, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{count}</strong></motion.div>)}</div>
      <div className="activity-tabs">{[["all", "Alle Aktivitäten"], ["changes", "Änderungen"], ["files", "Dateien & Exporte"], ["roles", "Rollen & Rechte"], ["security", "Sicherheit"], ["errors", "Fehler"], ["system", "System"]].map(([key, label]) => <button className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)}>{label}</button>)}</div>
      <div className="activity-filter-panel">
        <label><Search size={16} />Suche<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nutzer, Aktion, Bereich, Nachricht" /></label>
        <label>Zeitraum<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="all">Alle</option><option value="today">Heute</option><option value="7">7 Tage</option><option value="30">30 Tage</option><option value="90">90 Tage</option></select></label>
        <label>Nutzer<select value={user} onChange={(e) => setUser(e.target.value)}><option value="all">Alle</option>{data.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        <label>Rolle<select value={role} onChange={(e) => setRole(e.target.value)}><option value="all">Alle</option><option value="inhaber">Inhaber</option><option value="pdl">PDL</option><option value="verwaltung">Verwaltung</option><option value="mitarbeiter">Mitarbeiter</option></select></label>
        <label>Aktion<select value={action} onChange={(e) => setAction(e.target.value)}><option value="all">Alle</option>{Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Bereich<select value={entity} onChange={(e) => setEntity(e.target.value)}><option value="all">Alle</option>{Object.entries(entityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Schweregrad<select value={severity} onChange={(e) => setSeverity(e.target.value)}><option value="all">Alle</option>{Object.entries(severityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <button className="button secondary" onClick={reset}><FilterX size={16} />Zurücksetzen</button>
      </div>
      <AnimatePresence mode="wait"><motion.div className="activity-list" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{data.logs.length === 0 ? <div className="empty-state"><strong>Noch keine Aktivitäten vorhanden.</strong><p>Sobald Aktionen im System durchgeführt werden, erscheinen hier die entsprechenden Protokolle.</p></div> : filtered.length === 0 ? <div className="empty-state"><strong>{tab === "security" ? "Keine Sicherheitsereignisse vorhanden." : tab === "system" ? "Keine Systemereignisse vorhanden." : "Keine Protokolle gefunden."}</strong></div> : filtered.map((log) => <motion.article className="activity-card" key={log.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><div className="activity-card-main"><span>{formatDate(log.created_at)}</span><h2>{value(log.entity_label) !== "Nicht hinterlegt" ? String(value(log.entity_label)) : entityLabels[log.entity_type] ?? log.entity_type}</h2><p>{value(log.message)}</p></div><div className="activity-badges"><span className={`activity-action ${log.action}`}>{actionLabels[log.action] ?? log.action}</span><span className="activity-entity">{entityLabels[log.entity_type] ?? log.entity_type}</span><span className={`activity-severity ${log.severity}`}>{severityLabels[log.severity]}</span><span className={`activity-status ${log.status}`}>{statusLabels[log.status]}</span></div><div className="activity-meta"><div><span>Nutzer</span><strong>{value(log.actor_name)}</strong></div><div><span>Rolle</span><strong>{value(log.actor_role)}</strong></div></div><div className="activity-actions"><Detail log={log} /></div></motion.article>)}</motion.div></AnimatePresence>
    </motion.section>
  );
}
