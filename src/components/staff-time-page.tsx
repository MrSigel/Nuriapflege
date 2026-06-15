"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, Eye, FilterX, Play, Search, Square, TimerReset, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type TimeEntry = {
  id: string; company_id: string; employee_id: string; client_id: string | null; shift_id: string | null; tour_id: string | null; tour_stop_id: string | null;
  entry_date: string; start_time: string; end_time: string | null; break_minutes: number; duration_minutes: number; entry_type: string; status: string; source: string; notes: string | null;
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string;
};
type ClientRef = { id: string; first_name: string; last_name: string };
type ShiftRef = { id: string; title: string; client_id: string | null };
type TourRef = { id: string; title: string };
type StopRef = { id: string; client_id: string | null };
type Profile = { companyId: string; userId: string };
type TabKey = "today" | "week" | "month" | "open" | "history";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "today", label: "Heute" },
  { key: "week", label: "Diese Woche" },
  { key: "month", label: "Monat" },
  { key: "open", label: "Offen" },
  { key: "history", label: "Verlauf" },
];

const typeLabels: Record<string, string> = {
  work_time: "Arbeitszeit",
  break: "Pause",
  client_visit: "Klienteneinsatz",
  tour_time: "Tourzeit",
  shift_time: "Dienstzeit",
  manual_correction: "Korrektur",
  admin_time: "Verwaltung",
  other: "Sonstiges",
};
const statusLabels: Record<string, string> = { running: "Läuft", submitted: "Eingereicht", approved: "Genehmigt", rejected: "Abgelehnt", corrected: "Korrigiert", draft: "Entwurf" };
const sourceLabels: Record<string, string> = { manual_employee: "Mitarbeiter", manual: "Manuell", tour_wizard: "Tour", system: "System" };

function todayKey() { return new Date().toISOString().slice(0, 10); }
function weekStartKey(today: string) { const d = new Date(`${today}T00:00:00`); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0, 10); }
function weekEndKey(today: string) { const d = new Date(`${weekStartKey(today)}T00:00:00`); d.setDate(d.getDate() + 6); return d.toISOString().slice(0, 10); }
function monthStartKey(today: string) { return `${today.slice(0, 7)}-01`; }
function monthEndKey(today: string) { const d = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0); return d.toISOString().slice(0, 10); }
function value(input: string | null | undefined) { return input && input.trim() ? input : "Nicht hinterlegt"; }
function clientName(client?: ClientRef | null) { return client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt" : "Nicht hinterlegt"; }
function dateLabel(input: string | null | undefined) { return input ? new Intl.DateTimeFormat("de-DE").format(new Date(`${input}T00:00:00`)) : "Nicht hinterlegt"; }
function dateTimeLabel(input: string | null | undefined) { return input ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(input)) : "Nicht hinterlegt"; }
function timeNow() { return new Date().toTimeString().slice(0, 8); }
function minutes(start: string, end: string, pause = 0) {
  const [sh, sm, ss] = start.split(":").map(Number);
  const [eh, em, es] = end.split(":").map(Number);
  return Math.max(0, Math.round(((eh * 3600 + em * 60 + (es || 0)) - (sh * 3600 + sm * 60 + (ss || 0))) / 60) - pause);
}
function durationLabel(total: number) { const h = Math.floor((total || 0) / 60); const m = (total || 0) % 60; return h ? `${h} Std. ${m} Min.` : `${m} Min.`; }
function runningMinutes(entry: TimeEntry | null) { return entry ? minutes(entry.start_time, timeNow(), entry.break_minutes ?? 0) : 0; }

export function StaffTimePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [shifts, setShifts] = useState<ShiftRef[]>([]);
  const [tours, setTours] = useState<TourRef[]>([]);
  const [stops, setStops] = useState<StopRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("today");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [date, setDate] = useState("");
  const [detail, setDetail] = useState<TimeEntry | null>(null);
  const [tick, setTick] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Login ist aktuell nicht verfügbar."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign("/login"); return; }
    const { data: profileRow } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).maybeSingle();
    if (!profileRow?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profileRow.role)) { setError("Diese Seite ist für Ihr Benutzerprofil nicht freigegeben."); setLoading(false); return; }

    const today = todayKey();
    const from = monthStartKey(today);
    const to = monthEndKey(today);
    const { data: entryRows } = await supabase
      .from("time_entries")
      .select("id, company_id, employee_id, client_id, shift_id, tour_id, tour_stop_id, entry_date, start_time, end_time, break_minutes, duration_minutes, entry_type, status, source, notes, created_by, updated_by, created_at, updated_at")
      .eq("company_id", profileRow.company_id)
      .eq("employee_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: false })
      .order("start_time", { ascending: false });
    const entries = (entryRows ?? []) as TimeEntry[];
    const clientIds = Array.from(new Set(entries.map((entry) => entry.client_id).filter(Boolean))) as string[];
    const shiftIds = Array.from(new Set(entries.map((entry) => entry.shift_id).filter(Boolean))) as string[];
    const tourIds = Array.from(new Set(entries.map((entry) => entry.tour_id).filter(Boolean))) as string[];
    const stopIds = Array.from(new Set(entries.map((entry) => entry.tour_stop_id).filter(Boolean))) as string[];
    const [{ data: clientRows }, { data: shiftRows }, { data: tourRows }, { data: stopRows }] = await Promise.all([
      clientIds.length ? supabase.from("clients").select("id, first_name, last_name").eq("company_id", profileRow.company_id).in("id", clientIds) : Promise.resolve({ data: [] }),
      shiftIds.length ? supabase.from("shifts").select("id, title, client_id").eq("company_id", profileRow.company_id).in("id", shiftIds) : Promise.resolve({ data: [] }),
      tourIds.length ? supabase.from("tours").select("id, title").eq("company_id", profileRow.company_id).in("id", tourIds) : Promise.resolve({ data: [] }),
      stopIds.length ? supabase.from("tour_stops").select("id, client_id").eq("company_id", profileRow.company_id).in("id", stopIds) : Promise.resolve({ data: [] }),
    ]);
    setProfile({ companyId: profileRow.company_id, userId: user.id });
    setEntries(entries);
    setClients((clientRows ?? []) as ClientRef[]);
    setShifts((shiftRows ?? []) as ShiftRef[]);
    setTours((tourRows ?? []) as TourRef[]);
    setStops((stopRows ?? []) as StopRef[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const id = window.setInterval(() => setTick((current) => current + 1), 30000); return () => window.clearInterval(id); }, []);

  const today = todayKey();
  const weekStart = weekStartKey(today);
  const weekEnd = weekEndKey(today);
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const shiftMap = useMemo(() => new Map(shifts.map((shift) => [shift.id, shift])), [shifts]);
  const tourMap = useMemo(() => new Map(tours.map((tour) => [tour.id, tour])), [tours]);
  const stopMap = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops]);
  const running = useMemo(() => entries.find((entry) => entry.status === "running" && entry.entry_type === "work_time") ?? null, [entries, tick]);
  const filtered = useMemo(() => entries.filter((entry) => {
    if (tab === "today" && entry.entry_date !== today) return false;
    if (tab === "week" && (entry.entry_date < weekStart || entry.entry_date > weekEnd)) return false;
    if (tab === "month" && !entry.entry_date.startsWith(today.slice(0, 7))) return false;
    if (tab === "open" && entry.status !== "running") return false;
    if (tab === "history" && entry.entry_date >= today) return false;
    const client = entry.client_id ? clientMap.get(entry.client_id) : entry.tour_stop_id ? clientMap.get(stopMap.get(entry.tour_stop_id)?.client_id ?? "") : null;
    const haystack = [entry.notes, clientName(client), entry.shift_id ? shiftMap.get(entry.shift_id)?.title : "", entry.tour_id ? tourMap.get(entry.tour_id)?.title : ""].join(" ").toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (type === "all" || entry.entry_type === type) && (status === "all" || entry.status === status) && (source === "all" || entry.source === source) && (!date || entry.entry_date === date);
  }), [clientMap, date, entries, query, shiftMap, source, status, stopMap, tab, today, tourMap, type, weekEnd, weekStart]);

  const stats = [
    ["Heute erfasst", durationLabel(entries.filter((e) => e.entry_date === today).reduce((sum, e) => sum + (e.status === "running" ? runningMinutes(e) : e.duration_minutes ?? 0), 0)), CalendarDays],
    ["Diese Woche", durationLabel(entries.filter((e) => e.entry_date >= weekStart && e.entry_date <= weekEnd).reduce((sum, e) => sum + (e.status === "running" ? runningMinutes(e) : e.duration_minutes ?? 0), 0)), Clock3],
    ["Offene Zeit", running ? durationLabel(runningMinutes(running)) : "0 Min.", TimerReset],
    ["Pausen heute", durationLabel(entries.filter((e) => e.entry_date === today).reduce((sum, e) => sum + (e.break_minutes ?? 0), 0)), Square],
    ["Tourzeit heute", durationLabel(entries.filter((e) => e.entry_date === today && (e.entry_type === "tour_time" || e.source === "tour_wizard")).reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)), TimerReset],
    ["Nicht abgeschlossene Einträge", entries.filter((e) => e.status === "running").length, Play],
  ] as const;

  async function startWork() {
    if (!profile) return;
    if (running) { setNotice("Es läuft bereits eine Zeiterfassung."); return; }
    if (!window.confirm("Möchten Sie die Arbeitszeit jetzt starten?")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const now = new Date();
    const row = {
      company_id: profile.companyId,
      employee_id: profile.userId,
      entry_date: now.toISOString().slice(0, 10),
      start_time: now.toTimeString().slice(0, 8),
      end_time: null,
      break_minutes: 0,
      duration_minutes: 0,
      entry_type: "work_time",
      status: "running",
      source: "manual_employee",
      created_by: profile.userId,
      updated_by: profile.userId,
    };
    const { error: insertError } = await supabase.from("time_entries").insert(row);
    if (insertError) { setNotice("Arbeitszeit konnte nicht gestartet werden."); return; }
    setNotice("Arbeitszeit wurde gestartet.");
    await load();
  }

  async function stopWork() {
    if (!profile || !running) return;
    if (!window.confirm("Möchten Sie die Arbeitszeit beenden?")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const end = timeNow();
    const { error: updateError } = await supabase.from("time_entries").update({
      end_time: end,
      duration_minutes: minutes(running.start_time, end, running.break_minutes ?? 0),
      status: "submitted",
      updated_by: profile.userId,
    }).eq("company_id", profile.companyId).eq("employee_id", profile.userId).eq("id", running.id).eq("status", "running");
    if (updateError) { setNotice("Arbeitszeit konnte nicht beendet werden."); return; }
    setNotice("Arbeitszeit wurde beendet.");
    await load();
  }

  function relation(entry: TimeEntry) {
    if (entry.tour_stop_id) return "Tourstopp";
    if (entry.tour_id) return value(tourMap.get(entry.tour_id)?.title) || "Tour";
    if (entry.shift_id) return value(shiftMap.get(entry.shift_id)?.title) || "Dienst";
    return "Nicht hinterlegt";
  }

  function entryClient(entry: TimeEntry) {
    const direct = entry.client_id ? clientMap.get(entry.client_id) : null;
    const stopClient = entry.tour_stop_id ? clientMap.get(stopMap.get(entry.tour_stop_id)?.client_id ?? "") : null;
    return direct ?? stopClient ?? null;
  }

  return (
    <motion.section className="page staff-time-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="documents-header">
        <div><h1>Meine Zeiterfassung</h1><p>Ihre eigenen Arbeitszeiten und Einsatzzeiten.</p></div>
        <div className="documents-header-actions">
          {!running ? <motion.button className="button" type="button" onClick={startWork} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><Play size={16} />Arbeitszeit starten</motion.button> : <motion.button className="button" type="button" onClick={stopWork} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><Square size={16} />Arbeitszeit beenden</motion.button>}
        </div>
      </div>
      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}
      <div className="documents-stats-grid">{stats.map(([label, amount, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{amount}</strong></motion.div>)}</div>
      <motion.article className="tour-card current-stop-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="tour-card-header"><div><span>Aktueller Status</span><h2>{running ? `Arbeitszeit läuft seit ${running.start_time.slice(0, 5)}` : "Keine laufende Zeiterfassung"}</h2></div><span className={`shift-status ${running ? "in_progress" : "planned"}`}>{running ? durationLabel(runningMinutes(running)) : "0 Min."}</span></div>
        <div className="location-actions">{running ? <><button className="button secondary" type="button" disabled title="Pausenfunktion wird vorbereitet.">Pausenfunktion wird vorbereitet.</button><button className="button" type="button" onClick={stopWork}><Square size={15} />Arbeitszeit beenden</button></> : <button className="button" type="button" onClick={startWork}><Play size={15} />Arbeitszeit starten</button>}</div>
      </motion.article>
      <div className="settings-tabs staff-tabs">{tabs.map((item) => <motion.button key={item.key} className={`settings-tab ${tab === item.key ? "active" : ""}`} type="button" onClick={() => setTab(item.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>{item.label}</motion.button>)}</div>
      <motion.div className="documents-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Notiz, Dienst, Klient, Tour" /></label>
        <label>Typ<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Alle</option>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Quelle<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Alle</option>{Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Datum<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <button className="button secondary" type="button" onClick={() => { setQuery(""); setType("all"); setStatus("all"); setSource("all"); setDate(""); }}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>
      {error ? <motion.div className="empty-state"><strong>{error}</strong></motion.div> : loading ? <motion.div className="empty-state"><strong>Zeiten werden geladen.</strong></motion.div> : filtered.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>Noch keine Zeiten erfasst.</strong><p>Starten Sie Ihre Arbeitszeit oder erfassen Sie Zeiten über Dienst und Tour.</p><button className="button" type="button" onClick={startWork}><Play size={16} />Arbeitszeit starten</button></motion.div> : (
        <AnimatePresence mode="wait"><motion.div className="documents-list" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {filtered.map((entry, index) => <motion.article className="document-card" key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
            <div className="document-card-header"><div><span>{dateLabel(entry.entry_date)} · {entry.start_time.slice(0, 5)} - {entry.end_time?.slice(0, 5) ?? "läuft"}</span><h2><Clock3 size={18} />{typeLabels[entry.entry_type] ?? value(entry.entry_type)}</h2></div><div className="client-badges"><span className={`document-status ${entry.status}`}>{statusLabels[entry.status] ?? value(entry.status)}</span></div></div>
            <div className="document-details-grid"><div><span>Dauer</span><strong>{durationLabel(entry.status === "running" ? runningMinutes(entry) : entry.duration_minutes ?? 0)}</strong></div><div><span>Pause</span><strong>{durationLabel(entry.break_minutes ?? 0)}</strong></div><div><span>Quelle</span><strong>{sourceLabels[entry.source] ?? value(entry.source)}</strong></div><div><span>Bezug</span><strong>{relation(entry)}</strong></div><div><span>Klient</span><strong>{clientName(entryClient(entry))}</strong></div><div><span>Notiz</span><strong>{value(entry.notes)}</strong></div></div>
            <div className="location-actions"><button className="button secondary" type="button" onClick={() => setDetail(entry)}><Eye size={15} />Ansehen</button><button className="button secondary" type="button" disabled title="Korrekturanfrage wird vorbereitet."><TimerReset size={15} />Korrekturanfrage wird vorbereitet.</button></div>
          </motion.article>)}
        </motion.div></AnimatePresence>
      )}
      <AnimatePresence>{detail ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{typeLabels[detail.entry_type] ?? value(detail.entry_type)}</h2><p>{dateLabel(detail.entry_date)}</p></div><button className="icon-button" type="button" onClick={() => setDetail(null)}><X size={18} /></button></div><div className="document-details-grid"><div><span>Startzeit</span><strong>{value(detail.start_time?.slice(0, 5))}</strong></div><div><span>Endzeit</span><strong>{value(detail.end_time?.slice(0, 5))}</strong></div><div><span>Dauer</span><strong>{durationLabel(detail.status === "running" ? runningMinutes(detail) : detail.duration_minutes ?? 0)}</strong></div><div><span>Pause</span><strong>{durationLabel(detail.break_minutes ?? 0)}</strong></div><div><span>Status</span><strong>{statusLabels[detail.status] ?? value(detail.status)}</strong></div><div><span>Quelle</span><strong>{sourceLabels[detail.source] ?? value(detail.source)}</strong></div><div><span>Bezug</span><strong>{relation(detail)}</strong></div><div><span>Klient</span><strong>{clientName(entryClient(detail))}</strong></div><div><span>Erstellt am</span><strong>{dateTimeLabel(detail.created_at)}</strong></div><div><span>Zuletzt aktualisiert</span><strong>{dateTimeLabel(detail.updated_at)}</strong></div></div><div className="location-detail-panel"><p>{value(detail.notes)}</p></div></motion.div></motion.div> : null}</AnimatePresence>
    </motion.section>
  );
}
