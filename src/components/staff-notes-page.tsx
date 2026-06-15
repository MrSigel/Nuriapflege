"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, Edit3, Eye, FilterX, MessageSquarePlus, Search, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ClientRef = { id: string; first_name: string; last_name: string; city: string | null };
type ShiftRef = { id: string; client_id: string | null; title: string; date: string; suggested_end_time: string | null; status: string };
type TourRef = { id: string; title: string; tour_date: string; status: string };
type StopRef = { id: string; tour_id: string; client_id: string | null; shift_id: string | null; suggested_time: string | null; status: string; completed_at: string | null };
type Note = {
  id: string; company_id: string; client_id: string; employee_id: string | null; shift_id: string | null; tour_id: string | null; tour_stop_id: string | null;
  documentation_date: string; documentation_time: string | null; category: string; title: string; content: string; status: string; visibility: string;
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string;
};
type AssignedStop = StopRef & { tour: TourRef | null };
type Assignment = { client: ClientRef; shifts: ShiftRef[]; stops: AssignedStop[]; accessUntil: string | null; canCreate: boolean };
type Profile = { userId: string; companyId: string };
type TabKey = "today" | "week" | "mine" | "handover" | "history";
type ModalMode = "create" | "edit";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "today", label: "Heute" },
  { key: "week", label: "Diese Woche" },
  { key: "mine", label: "Meine Notizen" },
  { key: "handover", label: "Übergaben" },
  { key: "history", label: "Verlauf" },
];

const categories = [
  ["uebergabe", "Übergabe"],
  ["beobachtung", "Beobachtung"],
  ["hinweis", "Hinweis"],
  ["ereignis", "Ereignis"],
  ["sonstiges", "Sonstiges"],
];

const visibilityLabels: Record<string, string> = { internal: "Intern", care_team: "Pflegeteam", management: "Leitung" };
const statusLabels: Record<string, string> = { draft: "Entwurf", submitted: "Eingereicht", reviewed: "Geprüft", archived: "Archiviert" };

function todayKey() { return new Date().toISOString().slice(0, 10); }
function weekEndKey(today: string) { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() + 6); return d.toISOString().slice(0, 10); }
function startWindowKey(today: string) { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }
function endWindowKey(today: string) { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); }
function value(input: string | null | undefined) { return input && input.trim() ? input : "Nicht hinterlegt"; }
function clientName(client?: ClientRef | null) { return client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt" : "Nicht hinterlegt"; }
function dateLabel(input: string | null | undefined) { return input ? new Intl.DateTimeFormat("de-DE").format(new Date(`${input.slice(0, 10)}T00:00:00`)) : "Nicht hinterlegt"; }
function dateTimeLabel(input: string | null | undefined) { return input ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(input)) : "Nicht hinterlegt"; }
function addHours(input: string, hours: number) { const d = new Date(input); d.setHours(d.getHours() + hours); return d.toISOString(); }
function catLabel(category: string) { return categories.find(([key]) => key === category)?.[1] ?? category; }

export function StaffNotesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tab, setTab] = useState<TabKey>("today");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [source, setSource] = useState("all");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detail, setDetail] = useState<Note | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ client_id: "", shift_id: "", tour_id: "", tour_stop_id: "", category: "uebergabe", title: "", content: "", visibility: "care_team", documentation_date: todayKey(), documentation_time: new Date().toTimeString().slice(0, 5) });

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
    const [{ data: shiftRows }, { data: tourRows }] = await Promise.all([
      supabase.from("shifts").select("id, client_id, title, date, suggested_end_time, status").eq("company_id", profileRow.company_id).eq("employee_id", user.id).gte("date", startWindowKey(today)).lte("date", endWindowKey(today)),
      supabase.from("tours").select("id, title, tour_date, status").eq("company_id", profileRow.company_id).eq("employee_id", user.id).gte("tour_date", startWindowKey(today)).lte("tour_date", endWindowKey(today)),
    ]);
    const tours = (tourRows ?? []) as TourRef[];
    const tourIds = tours.map((tour) => tour.id);
    const { data: stopRows } = tourIds.length ? await supabase.from("tour_stops").select("id, tour_id, client_id, shift_id, suggested_time, status, completed_at").eq("company_id", profileRow.company_id).in("tour_id", tourIds) : { data: [] };
    const shifts = (shiftRows ?? []) as ShiftRef[];
    const stops: AssignedStop[] = ((stopRows ?? []) as StopRef[]).map((stop) => ({ ...stop, tour: tours.find((tour) => tour.id === stop.tour_id) ?? null }));
    const allowedClientIds = Array.from(new Set([...shifts.map((shift) => shift.client_id), ...stops.map((stop) => stop.client_id)].filter(Boolean))) as string[];
    const [{ data: clientRows }, { data: noteRows }] = await Promise.all([
      allowedClientIds.length ? supabase.from("clients").select("id, first_name, last_name, city").eq("company_id", profileRow.company_id).in("id", allowedClientIds) : Promise.resolve({ data: [] }),
      allowedClientIds.length ? supabase.from("care_documentation").select("id, company_id, client_id, employee_id, shift_id, tour_id, tour_stop_id, documentation_date, documentation_time, category, title, content, status, visibility, created_by, updated_by, created_at, updated_at").eq("company_id", profileRow.company_id).in("client_id", allowedClientIds).in("category", ["uebergabe", "beobachtung", "hinweis", "ereignis", "sonstiges"]).or(`employee_id.eq.${user.id},created_by.eq.${user.id},visibility.eq.care_team`).order("documentation_date", { ascending: false }).order("documentation_time", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);

    const now = Date.now();
    const clients = new Map((clientRows ?? []).map((client) => [client.id, client as ClientRef]));
    const nextAssignments = allowedClientIds.map((id) => {
      const client = clients.get(id);
      if (!client) return null;
      const clientShifts = shifts.filter((shift) => shift.client_id === id);
      const clientStops = stops.filter((stop) => stop.client_id === id);
      const expiries = [
        ...clientShifts.map((shift) => addHours(`${shift.date}T${shift.suggested_end_time ?? "23:59:59"}`, 24)),
        ...clientStops.map((stop) => addHours(stop.completed_at ?? `${stop.tour?.tour_date ?? today}T23:59:59`, 24)),
      ].sort();
      const accessUntil = expiries.at(-1) ?? null;
      return { client, shifts: clientShifts, stops: clientStops, accessUntil, canCreate: Boolean(accessUntil && new Date(accessUntil).getTime() >= now) };
    }).filter((item): item is Assignment => Boolean(item));
    setProfile({ companyId: profileRow.company_id, userId: user.id });
    setAssignments(nextAssignments);
    setNotes((noteRows ?? []) as Note[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const clientMap = useMemo(() => new Map(assignments.map((item) => [item.client.id, item.client])), [assignments]);
  const assignmentMap = useMemo(() => new Map(assignments.map((item) => [item.client.id, item])), [assignments]);
  const today = todayKey();
  const weekEnd = weekEndKey(today);
  const filtered = useMemo(() => notes.filter((note) => {
    const client = clientMap.get(note.client_id);
    const haystack = [clientName(client), note.title, note.content].join(" ").toLowerCase();
    if (tab === "today" && note.documentation_date !== today) return false;
    if (tab === "week" && (note.documentation_date < today || note.documentation_date > weekEnd)) return false;
    if (tab === "mine" && note.created_by !== profile?.userId && note.employee_id !== profile?.userId) return false;
    if (tab === "handover" && note.category !== "uebergabe") return false;
    if (tab === "history" && note.documentation_date >= today) return false;
    return (!query || haystack.includes(query.toLowerCase()))
      && (category === "all" || note.category === category)
      && (visibility === "all" || note.visibility === visibility)
      && (clientId === "all" || note.client_id === clientId)
      && (!date || note.documentation_date === date)
      && (source === "all" || (source === "shift" ? Boolean(note.shift_id) : Boolean(note.tour_id || note.tour_stop_id)));
  }), [category, clientId, clientMap, date, notes, profile?.userId, query, source, tab, today, visibility, weekEnd]);

  const stats = [
    ["Notizen heute", notes.filter((note) => note.documentation_date === today).length, CalendarDays],
    ["Übergaben heute", notes.filter((note) => note.documentation_date === today && note.category === "uebergabe").length, MessageSquarePlus],
    ["Eigene Notizen", notes.filter((note) => note.created_by === profile?.userId || note.employee_id === profile?.userId).length, Eye],
    ["Offene Entwürfe", notes.filter((note) => note.status === "draft").length, Edit3],
    ["Team-Übergaben", notes.filter((note) => note.category === "uebergabe" && note.visibility === "care_team").length, Users],
    ["Zugriff läuft bald ab", assignments.filter((item) => item.accessUntil && new Date(item.accessUntil).getTime() - Date.now() <= 6 * 60 * 60 * 1000 && new Date(item.accessUntil).getTime() >= Date.now()).length, Clock3],
  ] as const;

  function resetForm() {
    setForm({ client_id: "", shift_id: "", tour_id: "", tour_stop_id: "", category: "uebergabe", title: "", content: "", visibility: "care_team", documentation_date: todayKey(), documentation_time: new Date().toTimeString().slice(0, 5) });
    setEditing(null);
  }

  function openCreate() { resetForm(); setModalMode("create"); }
  function openEdit(note: Note) {
    if (note.created_by !== profile?.userId && note.employee_id !== profile?.userId) return;
    setEditing(note);
    setForm({ client_id: note.client_id, shift_id: note.shift_id ?? "", tour_id: note.tour_id ?? "", tour_stop_id: note.tour_stop_id ?? "", category: note.category, title: note.title, content: note.content, visibility: note.visibility, documentation_date: note.documentation_date, documentation_time: (note.documentation_time ?? "").slice(0, 5) });
    setModalMode("edit");
  }
  function closeModal() {
    if ((form.title || form.content) && !window.confirm("Änderungen verwerfen?")) return;
    setModalMode(null);
    resetForm();
  }

  async function saveNote() {
    if (!profile || !form.client_id || !form.category || !form.title.trim() || !form.content.trim() || !form.visibility) { setNotice("Bitte füllen Sie alle Pflichtfelder aus."); return; }
    const assignment = assignmentMap.get(form.client_id);
    if (!assignment?.canCreate && modalMode === "create") { setNotice("Für diesen Klienten ist aktuell keine neue Notiz erlaubt."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const row = { category: form.category, title: form.title.trim(), content: form.content.trim(), visibility: form.visibility, documentation_date: form.documentation_date, documentation_time: form.documentation_time || null, updated_by: profile.userId };
    const result = modalMode === "edit" && editing
      ? await supabase.from("care_documentation").update(row).eq("company_id", profile.companyId).eq("id", editing.id).or(`created_by.eq.${profile.userId},employee_id.eq.${profile.userId}`)
      : await supabase.from("care_documentation").insert({ ...row, company_id: profile.companyId, client_id: form.client_id, employee_id: profile.userId, shift_id: form.shift_id || null, tour_id: form.tour_id || null, tour_stop_id: form.tour_stop_id || null, status: "submitted", created_by: profile.userId });
    if (result.error) { setNotice(modalMode === "edit" ? "Notiz konnte nicht aktualisiert werden." : "Notiz konnte nicht gespeichert werden."); return; }
    setNotice(modalMode === "edit" ? "Notiz wurde aktualisiert." : "Notiz wurde gespeichert.");
    setModalMode(null);
    resetForm();
    await load();
  }

  const selectedAssignment = assignmentMap.get(form.client_id);

  return (
    <motion.section className="page clients-page staff-notes-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="clients-header"><div><h1>Notizen / Übergaben</h1><p>Eigene Hinweise und Übergaben zu Ihren zugewiesenen Patienten.</p></div><div className="clients-header-actions"><motion.button className="button" type="button" onClick={openCreate} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><MessageSquarePlus size={16} />Notiz hinzufügen</motion.button></div></div>
      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}
      <div className="client-stats-grid">{stats.map(([label, amount, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{amount}</strong></motion.div>)}</div>
      <div className="settings-tabs staff-tabs">{tabs.map((item) => <motion.button key={item.key} className={`settings-tab ${tab === item.key ? "active" : ""}`} type="button" onClick={() => setTab(item.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>{item.label}</motion.button>)}</div>
      <motion.div className="client-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Klient, Titel, Inhalt" /></label>
        <label>Kategorie<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Alle</option>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Sichtbarkeit<select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="all">Alle</option><option value="internal">Intern</option><option value="care_team">Pflegeteam</option></select></label>
        <label>Klient<select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="all">Alle</option>{assignments.map((item) => <option key={item.client.id} value={item.client.id}>{clientName(item.client)}</option>)}</select></label>
        <label>Datum<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label>Dienst/Tour<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Alle</option><option value="shift">Dienst</option><option value="tour">Tour</option></select></label>
        <button className="button secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); setVisibility("all"); setClientId("all"); setSource("all"); setDate(""); }}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>
      {error ? <motion.div className="empty-state"><strong>{error}</strong></motion.div> : loading ? <motion.div className="empty-state"><strong>Notizen werden geladen.</strong></motion.div> : filtered.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>Noch keine Notizen vorhanden.</strong><p>Fügen Sie eine Notiz oder Übergabe zu einem zugewiesenen Patienten hinzu.</p><button className="button" type="button" onClick={openCreate}><MessageSquarePlus size={16} />Notiz hinzufügen</button></motion.div> : (
        <AnimatePresence mode="wait"><motion.div className="clients-list" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {filtered.map((note, index) => {
            const client = clientMap.get(note.client_id);
            const own = note.created_by === profile?.userId || note.employee_id === profile?.userId;
            return <motion.article className="client-card staff-note-card" key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
              <div className="client-card-header"><div><span>{dateLabel(note.documentation_date)} · {value(note.documentation_time?.slice(0, 5))}</span><h2>{note.title}</h2></div><span className={`location-status ${note.category === "uebergabe" ? "active" : "planned"}`}>{catLabel(note.category)}</span></div>
              <div className="client-details-grid"><div><span>Klient</span><strong>{clientName(client)}</strong></div><div><span>Bezug</span><strong>{note.tour_stop_id ? "Tourstopp" : note.tour_id ? "Tour" : note.shift_id ? "Dienst" : "Nicht hinterlegt"}</strong></div><div><span>Sichtbarkeit</span><strong>{visibilityLabels[note.visibility] ?? value(note.visibility)}</strong></div><div><span>Erstellt von</span><strong>{own ? "Eigene Notiz" : "Pflegeteam"}</strong></div><div><span>Status</span><strong>{statusLabels[note.status] ?? value(note.status)}</strong></div><div><span>Vorschau</span><strong>{note.content}</strong></div></div>
              <div className="location-actions"><button className="button secondary" type="button" onClick={() => setDetail(note)}><Eye size={15} />Ansehen</button>{own ? <button className="button secondary" type="button" onClick={() => openEdit(note)}><Edit3 size={15} />Bearbeiten</button> : null}<button className="button secondary" type="button" disabled title="Löschen wird vorbereitet."><Trash2 size={15} />Löschen wird vorbereitet.</button></div>
            </motion.article>;
          })}
        </motion.div></AnimatePresence>
      )}
      <AnimatePresence>{detail ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{detail.title}</h2><p>{catLabel(detail.category)}</p></div><button className="icon-button" type="button" onClick={() => setDetail(null)}><X size={18} /></button></div><div className="client-details-grid"><div><span>Klient</span><strong>{clientName(clientMap.get(detail.client_id))}</strong></div><div><span>Datum</span><strong>{dateLabel(detail.documentation_date)}</strong></div><div><span>Uhrzeit</span><strong>{value(detail.documentation_time?.slice(0, 5))}</strong></div><div><span>Sichtbarkeit</span><strong>{visibilityLabels[detail.visibility] ?? value(detail.visibility)}</strong></div><div><span>Bezug</span><strong>{detail.tour_stop_id ? "Tourstopp" : detail.tour_id ? "Tour" : detail.shift_id ? "Dienst" : "Nicht hinterlegt"}</strong></div><div><span>Erstellt von</span><strong>{detail.created_by === profile?.userId || detail.employee_id === profile?.userId ? "Eigene Notiz" : "Pflegeteam"}</strong></div><div><span>Zuletzt aktualisiert</span><strong>{dateTimeLabel(detail.updated_at)}</strong></div><div><span>Status</span><strong>{statusLabels[detail.status] ?? value(detail.status)}</strong></div></div><div className="location-detail-panel"><p>{detail.content}</p></div></motion.div></motion.div> : null}</AnimatePresence>
      <AnimatePresence>{modalMode ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{modalMode === "edit" ? "Notiz bearbeiten" : "Notiz hinzufügen"}</h2><p>{form.client_id ? clientName(clientMap.get(form.client_id)) : "Zugewiesenen Klienten wählen"}</p></div><button className="icon-button" type="button" onClick={closeModal}><X size={18} /></button></div><div className="care-form">
        <label>Klient<select required value={form.client_id} disabled={modalMode === "edit"} onChange={(event) => setForm((current) => ({ ...current, client_id: event.target.value, shift_id: "", tour_id: "", tour_stop_id: "" }))}><option value="">Klient wählen</option>{assignments.filter((item) => item.canCreate || modalMode === "edit").map((item) => <option key={item.client.id} value={item.client.id}>{clientName(item.client)}</option>)}</select></label>
        <label>Dienst<select value={form.shift_id} disabled={modalMode === "edit"} onChange={(event) => setForm((current) => ({ ...current, shift_id: event.target.value }))}><option value="">Kein Dienst</option>{selectedAssignment?.shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.title} · {dateLabel(shift.date)}</option>)}</select></label>
        <label>Tour<select value={form.tour_id} disabled={modalMode === "edit"} onChange={(event) => setForm((current) => ({ ...current, tour_id: event.target.value }))}><option value="">Keine Tour</option>{selectedAssignment?.stops.map((stop) => stop.tour).filter(Boolean).map((tour) => <option key={tour!.id} value={tour!.id}>{tour!.title} · {dateLabel(tour!.tour_date)}</option>)}</select></label>
        <label>Tourstopp<select value={form.tour_stop_id} disabled={modalMode === "edit"} onChange={(event) => setForm((current) => ({ ...current, tour_stop_id: event.target.value }))}><option value="">Kein Tourstopp</option>{selectedAssignment?.stops.map((stop) => <option key={stop.id} value={stop.id}>{dateLabel(stop.tour?.tour_date)} · {value(stop.suggested_time?.slice(0, 5))}</option>)}</select></label>
        <label>Kategorie<select required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, visibility: event.target.value === "uebergabe" ? "care_team" : current.visibility }))}>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Sichtbarkeit<select required value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}><option value="care_team">Pflegeteam</option><option value="internal">Intern</option></select></label>
        <label>Datum<input type="date" value={form.documentation_date} onChange={(event) => setForm((current) => ({ ...current, documentation_date: event.target.value }))} /></label>
        <label>Uhrzeit<input type="time" value={form.documentation_time} onChange={(event) => setForm((current) => ({ ...current, documentation_time: event.target.value }))} /></label>
        <label className="care-form-wide">Titel<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="care-form-wide">Inhalt<textarea rows={6} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} /></label>
        <div className="care-form-actions"><button className="button secondary" type="button" onClick={closeModal}>Abbrechen</button><button className="button" type="button" onClick={saveNote}>Notiz speichern</button></div>
      </div></motion.div></motion.div> : null}</AnimatePresence>
    </motion.section>
  );
}
