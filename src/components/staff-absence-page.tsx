"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock3, Eye, FilterX, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Profile = { companyId: string; userId: string };
type Absence = {
  id: string; company_id: string; employee_id: string; absence_type: string; start_date: string; end_date: string; status: string;
  reason: string | null; response_note: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
};
type TabKey = "current" | "planned" | "approved" | "open" | "history";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "current", label: "Aktuell" },
  { key: "planned", label: "Geplant" },
  { key: "approved", label: "Genehmigt" },
  { key: "open", label: "Offen" },
  { key: "history", label: "Verlauf" },
];
const typeLabels: Record<string, string> = { vacation: "Urlaub", sick: "Krankheit", training: "Fortbildung", other: "Sonstiges" };
const statusLabels: Record<string, string> = { submitted: "Eingereicht", approved: "Genehmigt", rejected: "Abgelehnt", cancelled: "Zurückgezogen" };

function todayKey() { return new Date().toISOString().slice(0, 10); }
function value(input: string | null | undefined) { return input && input.trim() ? input : "Nicht hinterlegt"; }
function dateLabel(input: string) { return new Intl.DateTimeFormat("de-DE").format(new Date(`${input}T00:00:00`)); }
function daysBetween(start: string, end: string) { return Math.max(1, Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1); }

export function StaffAbsencePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Absence[]>([]);
  const [tab, setTab] = useState<TabKey>("current");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Absence | null>(null);
  const [form, setForm] = useState({ absence_type: "vacation", start_date: todayKey(), end_date: todayKey(), reason: "" });

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign("/login"); return; }
    const { data: profileRow } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).maybeSingle();
    if (!profileRow?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profileRow.role)) { setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support."); setLoading(false); return; }
    const { data } = await supabase.from("employee_absences").select("id, company_id, employee_id, absence_type, start_date, end_date, status, reason, response_note, reviewed_at, created_at, updated_at").eq("company_id", profileRow.company_id).eq("employee_id", user.id).order("start_date", { ascending: false });
    setProfile({ companyId: profileRow.company_id, userId: user.id });
    setItems((data ?? []) as Absence[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const today = todayKey();
  const filtered = useMemo(() => items.filter((item) => {
    if (tab === "current" && !(item.start_date <= today && item.end_date >= today && item.status === "approved")) return false;
    if (tab === "planned" && !(item.start_date > today && item.status !== "cancelled")) return false;
    if (tab === "approved" && item.status !== "approved") return false;
    if (tab === "open" && item.status !== "submitted") return false;
    if (tab === "history" && !(item.end_date < today || item.status === "rejected" || item.status === "cancelled")) return false;
    const haystack = [typeLabels[item.absence_type], statusLabels[item.status], item.reason].join(" ").toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (type === "all" || item.absence_type === type) && (status === "all" || item.status === status);
  }), [items, query, status, tab, today, type]);

  const stats = [
    ["Offene Anträge", items.filter((item) => item.status === "submitted").length, Clock3],
    ["Genehmigt", items.filter((item) => item.status === "approved").length, CheckCircle2],
    ["Geplante Tage", items.filter((item) => item.start_date >= today && item.status === "approved").reduce((sum, item) => sum + daysBetween(item.start_date, item.end_date), 0), CalendarDays],
    ["Aktuell", items.filter((item) => item.start_date <= today && item.end_date >= today && item.status === "approved").length, CalendarDays],
  ] as const;

  function close() {
    if ((form.reason || form.start_date !== today || form.end_date !== today) && !window.confirm("Änderungen verwerfen?")) return;
    setOpen(false);
  }

  async function createAbsence() {
    if (!profile) return;
    if (!form.start_date || !form.end_date || form.end_date < form.start_date) { setNotice("Zeitraum ist ungültig."); return; }
    if (!window.confirm("Möchten Sie diese Abwesenheit beantragen?")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: insertError } = await supabase.from("employee_absences").insert({ company_id: profile.companyId, employee_id: profile.userId, absence_type: form.absence_type, start_date: form.start_date, end_date: form.end_date, reason: form.reason.trim() || null, status: "submitted", created_by: profile.userId, updated_by: profile.userId });
    if (insertError) { setNotice("Antrag konnte nicht gespeichert werden."); return; }
    setNotice("Antrag wurde eingereicht.");
    setOpen(false);
    setForm({ absence_type: "vacation", start_date: todayKey(), end_date: todayKey(), reason: "" });
    await load();
  }

  async function cancelAbsence(item: Absence) {
    if (!profile || item.status !== "submitted" || !window.confirm("Möchten Sie diesen Antrag zurückziehen?")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: updateError } = await supabase.from("employee_absences").update({ status: "cancelled", updated_by: profile.userId }).eq("company_id", profile.companyId).eq("employee_id", profile.userId).eq("id", item.id).eq("status", "submitted");
    if (updateError) { setNotice("Antrag konnte nicht zurückgezogen werden."); return; }
    setNotice("Antrag wurde zurückgezogen.");
    await load();
  }

  return (
    <motion.section className="page clients-page staff-absence-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="clients-header"><div><h1>Meine Abwesenheiten / Urlaub</h1><p>Ihre eigenen Abwesenheiten und Urlaubsanträge.</p></div><div className="clients-header-actions"><motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><Plus size={16} />Abwesenheit beantragen</motion.button></div></div>
      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}
      <div className="client-stats-grid">{stats.map(([label, amount, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{amount}</strong></motion.div>)}</div>
      <div className="settings-tabs staff-tabs">{tabs.map((item) => <motion.button key={item.key} className={`settings-tab ${tab === item.key ? "active" : ""}`} type="button" onClick={() => setTab(item.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>{item.label}</motion.button>)}</div>
      <motion.div className="client-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Typ, Status, Grund" /></label><label>Typ<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Alle</option>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="button secondary" type="button" onClick={() => { setQuery(""); setType("all"); setStatus("all"); }}><FilterX size={16} />Zurücksetzen</button></motion.div>
      {error ? <motion.div className="empty-state"><strong>{error}</strong></motion.div> : loading ? <motion.div className="empty-state"><strong>Abwesenheiten werden geladen.</strong></motion.div> : filtered.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>Noch keine Abwesenheiten vorhanden.</strong><p>Sobald Anträge vorhanden sind, erscheinen sie hier.</p></motion.div> : <AnimatePresence mode="wait"><motion.div className="clients-list" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{filtered.map((item, index) => <motion.article className="client-card" key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}><div className="client-card-header"><div><span>{dateLabel(item.start_date)} - {dateLabel(item.end_date)}</span><h2>{typeLabels[item.absence_type]}</h2></div><span className={`location-status ${item.status}`}>{statusLabels[item.status]}</span></div><div className="client-details-grid"><div><span>Tage</span><strong>{daysBetween(item.start_date, item.end_date)}</strong></div><div><span>Status</span><strong>{statusLabels[item.status]}</strong></div><div><span>Grund</span><strong>{value(item.reason)}</strong></div><div><span>Rückmeldung</span><strong>{value(item.response_note)}</strong></div></div><div className="location-actions"><button className="button secondary" type="button" onClick={() => setDetail(item)}><Eye size={15} />Ansehen</button>{item.status === "submitted" ? <button className="button secondary danger" type="button" onClick={() => cancelAbsence(item)}>Zurückziehen</button> : null}</div></motion.article>)}</motion.div></AnimatePresence>}
      <AnimatePresence>{detail ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{typeLabels[detail.absence_type]}</h2><p>{dateLabel(detail.start_date)} - {dateLabel(detail.end_date)}</p></div><button className="icon-button" type="button" onClick={() => setDetail(null)}><X size={18} /></button></div><div className="client-details-grid"><div><span>Status</span><strong>{statusLabels[detail.status]}</strong></div><div><span>Tage</span><strong>{daysBetween(detail.start_date, detail.end_date)}</strong></div><div><span>Grund</span><strong>{value(detail.reason)}</strong></div><div><span>Rückmeldung</span><strong>{value(detail.response_note)}</strong></div></div></motion.div></motion.div> : null}</AnimatePresence>
      <AnimatePresence>{open ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>Abwesenheit beantragen</h2><p>Eigenen Antrag einreichen.</p></div><button className="icon-button" type="button" onClick={close}><X size={18} /></button></div><div className="client-form"><label>Typ<select value={form.absence_type} onChange={(event) => setForm((current) => ({ ...current, absence_type: event.target.value }))}>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Von<input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} /></label><label>Bis<input type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} /></label><label className="client-form-wide">Grund<textarea rows={4} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} /></label><div className="client-form-actions client-form-wide"><button className="button secondary" type="button" onClick={close}>Abbrechen</button><button className="button" type="button" onClick={createAbsence}>Antrag einreichen</button></div></div></motion.div></motion.div> : null}</AnimatePresence>
    </motion.section>
  );
}
