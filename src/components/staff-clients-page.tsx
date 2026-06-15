"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Eye,
  FileUp,
  FilterX,
  MapPin,
  MessageSquarePlus,
  Phone,
  Route,
  Search,
  Stethoscope,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type StaffClient = {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  care_level: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  status: string | null;
};

type ShiftRow = {
  id: string;
  company_id: string;
  employee_id: string | null;
  client_id: string | null;
  title: string;
  date: string;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  status: string;
  notes: string | null;
};

type TourRow = {
  id: string;
  company_id: string;
  employee_id: string | null;
  title: string;
  tour_date: string;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  status: string;
};

type StopRow = {
  id: string;
  company_id: string;
  tour_id: string;
  client_id: string | null;
  shift_id: string | null;
  suggested_time: string | null;
  tasks: string | null;
  notes: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
};

type CareNote = {
  id: string;
  client_id: string;
  shift_id: string | null;
  tour_id: string | null;
  tour_stop_id: string | null;
  documentation_date: string;
  documentation_time: string | null;
  category: string;
  title: string;
  content: string;
  created_by: string | null;
  updated_at: string;
};

type Assignment = {
  client: StaffClient;
  shifts: ShiftRow[];
  stops: Array<StopRow & { tour: TourRow | null }>;
  notes: CareNote[];
  accessUntil: string | null;
  hasActiveAccess: boolean;
  lastDate: string;
};

type ProfileContext = { companyId: string; userId: string };
type TabKey = "today" | "week" | "active" | "history";

const tabItems: Array<{ key: TabKey; label: string }> = [
  { key: "today", label: "Heute" },
  { key: "week", label: "Diese Woche" },
  { key: "active", label: "Aktive Zugriffe" },
  { key: "history", label: "Verlauf" },
];

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  inactive: "Inaktiv",
  planned: "Geplant",
  in_progress: "Läuft",
  completed: "Erledigt",
  cancelled: "Abgesagt",
  skipped: "Übersprungen",
};

const noteCategories = [
  ["hinweis", "Hinweis"],
  ["uebergabe", "Übergabe"],
  ["beobachtung", "Beobachtung"],
  ["sonstiges", "Sonstiges"],
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekEndKey(today: string) {
  const date = new Date(`${today}T00:00:00`);
  date.setDate(date.getDate() + 6);
  return date.toISOString().slice(0, 10);
}

function startWindowKey(today: string) {
  const date = new Date(`${today}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function endWindowKey(today: string) {
  const date = new Date(`${today}T00:00:00`);
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function value(input: string | null | undefined) {
  return input && input.trim().length > 0 ? input : "Nicht hinterlegt";
}

function nameOf(client: StaffClient) {
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt";
}

function addressOf(client: StaffClient) {
  return [client.street, client.house_number, client.postal_code, client.city].filter(Boolean).join(" ") || "Nicht hinterlegt";
}

function formatDate(input: string | null | undefined) {
  if (!input) return "Nicht hinterlegt";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${input.slice(0, 10)}T00:00:00`));
}

function formatDateTime(input: string | null) {
  if (!input) return "Nicht hinterlegt";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(input));
}

function addHours(input: string, hours: number) {
  const date = new Date(input);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function timeRange(start: string | null, end: string | null) {
  if (!start && !end) return "Nicht hinterlegt";
  return [start?.slice(0, 5), end?.slice(0, 5)].filter(Boolean).join(" - ");
}

function latestDate(values: string[]) {
  return values.sort().at(-1) ?? todayKey();
}

export function StaffClientsPage() {
  const [tab, setTab] = useState<TabKey>("today");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [noteTarget, setNoteTarget] = useState<Assignment | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState("uebergabe");

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Login ist aktuell nicht verfügbar.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        window.location.assign("/login");
        return;
      }

      const { data: profileRow } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (!profileRow?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profileRow.role)) {
        setError("Diese Seite ist für Ihr Benutzerprofil nicht freigegeben.");
        setLoading(false);
        return;
      }

      const today = todayKey();
      const windowStart = startWindowKey(today);
      const windowEnd = endWindowKey(today);
      setProfile({ companyId: profileRow.company_id, userId: user.id });

      const [{ data: shiftRows }, { data: tourRows }] = await Promise.all([
        supabase
          .from("shifts")
          .select("id, company_id, employee_id, client_id, title, date, suggested_start_time, suggested_end_time, status, notes")
          .eq("company_id", profileRow.company_id)
          .eq("employee_id", user.id)
          .gte("date", windowStart)
          .lte("date", windowEnd)
          .order("date", { ascending: false }),
        supabase
          .from("tours")
          .select("id, company_id, employee_id, title, tour_date, suggested_start_time, suggested_end_time, status")
          .eq("company_id", profileRow.company_id)
          .eq("employee_id", user.id)
          .gte("tour_date", windowStart)
          .lte("tour_date", windowEnd)
          .order("tour_date", { ascending: false }),
      ]);

      const tours = (tourRows ?? []) as TourRow[];
      const tourIds = tours.map((tour) => tour.id);
      const { data: stopRows } = tourIds.length
        ? await supabase
            .from("tour_stops")
            .select("id, company_id, tour_id, client_id, shift_id, suggested_time, tasks, notes, status, started_at, completed_at")
            .eq("company_id", profileRow.company_id)
            .in("tour_id", tourIds)
            .order("suggested_time", { ascending: true })
        : { data: [] };

      const shifts = (shiftRows ?? []) as ShiftRow[];
      const stops = (stopRows ?? []) as StopRow[];
      const clientIds = Array.from(new Set([...shifts.map((shift) => shift.client_id), ...stops.map((stop) => stop.client_id)].filter(Boolean))) as string[];
      const [{ data: clientRows }, { data: noteRows }] = await Promise.all([
        clientIds.length
          ? supabase
              .from("clients")
              .select("id, company_id, first_name, last_name, phone, street, house_number, postal_code, city, care_level, primary_contact_name, primary_contact_phone, status")
              .eq("company_id", profileRow.company_id)
              .in("id", clientIds)
          : Promise.resolve({ data: [] }),
        clientIds.length
          ? supabase
              .from("care_documentation")
              .select("id, client_id, shift_id, tour_id, tour_stop_id, documentation_date, documentation_time, category, title, content, created_by, updated_at")
              .eq("company_id", profileRow.company_id)
              .in("client_id", clientIds)
              .or(`employee_id.eq.${user.id},created_by.eq.${user.id}`)
              .order("updated_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      if (!active) return;
      const now = Date.now();
      const tourMap = new Map(tours.map((tour) => [tour.id, tour]));
      const clientMap = new Map((clientRows ?? []).map((client) => [client.id, client as StaffClient]));
      const rows = clientIds
        .map((clientId) => {
          const client = clientMap.get(clientId);
          if (!client) return null;
          const clientShifts = shifts.filter((shift) => shift.client_id === clientId);
          const clientStops = stops.filter((stop) => stop.client_id === clientId).map((stop) => ({ ...stop, tour: tourMap.get(stop.tour_id) ?? null }));
          const dates = [...clientShifts.map((shift) => shift.date), ...clientStops.map((stop) => stop.tour?.tour_date ?? "")].filter(Boolean);
          const expiryCandidates = [
            ...clientShifts.map((shift) => `${shift.date}T${shift.suggested_end_time ?? "23:59:59"}`),
            ...clientStops.map((stop) => stop.completed_at ?? `${stop.tour?.tour_date ?? today}T23:59:59`),
          ].map((date) => addHours(date, 24));
          const accessUntil = expiryCandidates.sort().at(-1) ?? null;
          const hasActiveAccess = !accessUntil || new Date(accessUntil).getTime() >= now;
          return {
            client,
            shifts: clientShifts,
            stops: clientStops,
            notes: ((noteRows ?? []) as CareNote[]).filter((note) => note.client_id === clientId),
            accessUntil,
            hasActiveAccess,
            lastDate: latestDate(dates),
          };
        })
        .filter((row): row is Assignment => Boolean(row));

      setAssignments(rows);
      setLoading(false);
    }

    loadClients();
    return () => {
      active = false;
    };
  }, []);

  const today = todayKey();
  const weekEnd = weekEndKey(today);

  const filtered = useMemo(() => {
    return assignments.filter((item) => {
      const todayMatch = item.shifts.some((shift) => shift.date === today) || item.stops.some((stop) => stop.tour?.tour_date === today);
      const weekMatch = item.shifts.some((shift) => shift.date >= today && shift.date <= weekEnd) || item.stops.some((stop) => (stop.tour?.tour_date ?? "") >= today && (stop.tour?.tour_date ?? "") <= weekEnd);
      const activeMatch = item.hasActiveAccess && (item.shifts.some((shift) => shift.status === "planned" || shift.status === "in_progress") || item.stops.some((stop) => stop.status === "planned" || stop.status === "in_progress"));
      if (tab === "today" && !todayMatch) return false;
      if (tab === "week" && !weekMatch) return false;
      if (tab === "active" && !activeMatch) return false;
      if (tab === "history" && item.lastDate >= today) return false;
      const haystack = [nameOf(item.client), item.client.city, item.client.phone].filter(Boolean).join(" ").toLowerCase();
      const sourceMatch = source === "all" || (source === "shift" ? item.shifts.length > 0 : item.stops.length > 0);
      const statusMatch = status === "all" || item.shifts.some((shift) => shift.status === status) || item.stops.some((stop) => stop.status === status) || item.client.status === status;
      return (!query || haystack.includes(query.toLowerCase())) && sourceMatch && statusMatch;
    });
  }, [assignments, query, source, status, tab, today, weekEnd]);

  const stats = [
    ["Heute zugewiesen", assignments.filter((item) => item.shifts.some((shift) => shift.date === today) || item.stops.some((stop) => stop.tour?.tour_date === today)).length, CalendarDays],
    ["Diese Woche zugewiesen", assignments.filter((item) => item.shifts.some((shift) => shift.date >= today && shift.date <= weekEnd) || item.stops.some((stop) => (stop.tour?.tour_date ?? "") >= today && (stop.tour?.tour_date ?? "") <= weekEnd)).length, Users],
    ["Aktive Einsätze", assignments.filter((item) => item.shifts.some((shift) => shift.status === "in_progress") || item.stops.some((stop) => stop.status === "in_progress")).length, UserRoundCheck],
    ["Offene Tourstopps", assignments.reduce((sum, item) => sum + item.stops.filter((stop) => stop.status === "planned" || stop.status === "in_progress").length, 0), Route],
    ["Zugriff läuft bald ab", assignments.filter((item) => item.accessUntil && new Date(item.accessUntil).getTime() - Date.now() <= 6 * 60 * 60 * 1000 && new Date(item.accessUntil).getTime() >= Date.now()).length, Clock3],
    ["Eigene Notizen", assignments.reduce((sum, item) => sum + item.notes.length, 0), MessageSquarePlus],
  ] as const;

  async function saveNote() {
    if (!profile || !noteTarget || noteText.trim().length === 0) return;
    const firstShift = noteTarget.shifts[0] ?? null;
    const firstStop = noteTarget.stops[0] ?? null;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const now = new Date();
    const { data, error } = await supabase
      .from("care_documentation")
      .insert({
        company_id: profile.companyId,
        client_id: noteTarget.client.id,
        employee_id: profile.userId,
        shift_id: firstShift?.id ?? firstStop?.shift_id ?? null,
        tour_id: firstStop?.tour_id ?? null,
        tour_stop_id: firstStop?.id ?? null,
        documentation_date: now.toISOString().slice(0, 10),
        documentation_time: now.toTimeString().slice(0, 8),
        category: noteCategory === "hinweis" ? "sonstiges" : noteCategory,
        title: noteCategories.find(([key]) => key === noteCategory)?.[1] ?? "Notiz",
        content: noteText.trim(),
        status: "draft",
        visibility: "care_team",
        created_by: profile.userId,
        updated_by: profile.userId,
      })
      .select("id, client_id, shift_id, tour_id, tour_stop_id, documentation_date, documentation_time, category, title, content, created_by, updated_at")
      .single();
    if (error) {
      setNotice("Notiz konnte nicht gespeichert werden.");
      return;
    }
    setAssignments((current) => current.map((item) => (item.client.id === noteTarget.client.id ? { ...item, notes: [data as CareNote, ...item.notes] } : item)));
    setNotice("Notiz wurde gespeichert.");
    setNoteTarget(null);
    setNoteText("");
  }

  function closeNote() {
    if (noteText.trim().length > 0 && !window.confirm("Änderungen verwerfen?")) return;
    setNoteTarget(null);
    setNoteText("");
  }

  function primaryInfo(item: Assignment) {
    const shift = item.shifts.find((entry) => entry.date === today) ?? item.shifts[0] ?? null;
    const stop = item.stops.find((entry) => entry.tour?.tour_date === today) ?? item.stops[0] ?? null;
    return { shift, stop };
  }

  return (
    <motion.section className="page clients-page staff-clients-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="clients-header">
        <div>
          <h1>Meine Patienten / Klienten</h1>
          <p>Ihre aktuell zugewiesenen Patienten und Einsatzinformationen.</p>
        </div>
      </div>

      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}

      <div className="client-stats-grid">
        {stats.map(([label, amount, Icon], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
            <div className="stat-icon"><Icon size={18} /></div>
            <span>{label}</span>
            <strong>{amount}</strong>
          </motion.div>
        ))}
      </div>

      <div className="settings-tabs staff-tabs">
        {tabItems.map((item) => (
          <motion.button key={item.key} className={`settings-tab ${tab === item.key ? "active" : ""}`} type="button" onClick={() => setTab(item.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            {item.label}
          </motion.button>
        ))}
      </div>

      <motion.div className="client-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, Ort, Telefonnummer" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option><option value="planned">Geplant</option><option value="in_progress">Läuft</option><option value="completed">Erledigt</option><option value="active">Aktiv</option></select></label>
        <label>Tour/Dienst<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Alle</option><option value="shift">Dienst</option><option value="tour">Tour</option></select></label>
        <button className="button secondary" type="button" onClick={() => { setQuery(""); setStatus("all"); setSource("all"); }}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>

      {error ? (
        <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>{error}</strong></motion.div>
      ) : loading ? (
        <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>Patienten werden geladen.</strong></motion.div>
      ) : filtered.length === 0 ? (
        <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <strong>Keine Patienten zugewiesen.</strong>
          <p>Sobald Ihnen Dienste oder Touren zugewiesen werden, erscheinen die entsprechenden Patienten hier.</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div className="clients-list" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {filtered.map((item, index) => {
              const { shift, stop } = primaryInfo(item);
              return (
                <motion.article className="client-card staff-client-card" key={item.client.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
                  <div className="client-card-header">
                    <div>
                      <span>{value(item.client.city)}</span>
                      <h2>{nameOf(item.client)}</h2>
                    </div>
                    <span className={`location-status ${item.client.status ?? "active"}`}>{statusLabels[item.client.status ?? "active"] ?? value(item.client.status)}</span>
                  </div>
                  <div className="client-details-grid">
                    <div><span>Ort</span><strong>{value(item.client.city)}</strong></div>
                    <div><span>Telefon</span><strong>{value(item.client.phone)}</strong></div>
                    <div><span>Einsatz</span><strong>{shift ? "Dienst" : stop ? "Tourstopp" : "Nicht hinterlegt"}</strong></div>
                    <div><span>Datum</span><strong>{formatDate(shift?.date ?? stop?.tour?.tour_date)}</strong></div>
                    <div><span>Uhrzeit</span><strong>{shift ? timeRange(shift.suggested_start_time, shift.suggested_end_time) : value(stop?.suggested_time?.slice(0, 5))}</strong></div>
                    <div><span>Status</span><strong>{statusLabels[shift?.status ?? stop?.status ?? ""] ?? "Nicht hinterlegt"}</strong></div>
                    <div><span>Zugriff gültig bis</span><strong>{formatDateTime(item.accessUntil)}</strong></div>
                    <div><span>Aufgaben/Hinweise</span><strong>{value(stop?.tasks ?? stop?.notes ?? shift?.notes)}</strong></div>
                  </div>
                  <div className="location-actions">
                    <button className="button secondary" type="button" onClick={() => setSelected(item)}><Eye size={15} />Ansehen</button>
                    <button className="button secondary" type="button" onClick={() => setNoteTarget(item)}><MessageSquarePlus size={15} />Notiz hinzufügen</button>
                    <button className="button secondary" type="button" disabled title="Dokumentenupload wird vorbereitet."><FileUp size={15} />Dokumentenupload wird vorbereitet.</button>
                    {stop ? <button className="button secondary" type="button" onClick={() => window.location.assign("/mitarbeiter/tour")}><Route size={15} />Tour öffnen</button> : null}
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {selected ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div><h2>{nameOf(selected.client)}</h2><p>Einsatzinformationen</p></div>
                <button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={18} /></button>
              </div>
              <div className="client-details-grid">
                <div><span>Adresse</span><strong>{addressOf(selected.client)}</strong></div>
                <div><span>Telefon</span><strong>{value(selected.client.phone)}</strong></div>
                <div><span>Pflegegrad</span><strong>{value(selected.client.care_level)}</strong></div>
                <div><span>Ansprechpartner</span><strong>{value(selected.client.primary_contact_name)}</strong></div>
                <div><span>Ansprechpartner Telefon</span><strong>{value(selected.client.primary_contact_phone)}</strong></div>
                <div><span>Zugriff gültig bis</span><strong>{formatDateTime(selected.accessUntil)}</strong></div>
              </div>
              <div className="client-details-grid">
                <div><span>Dienst</span><strong>{selected.shifts[0] ? `${formatDate(selected.shifts[0].date)} · ${timeRange(selected.shifts[0].suggested_start_time, selected.shifts[0].suggested_end_time)}` : "Nicht hinterlegt"}</strong></div>
                <div><span>Tourstopp</span><strong>{selected.stops[0] ? `${formatDate(selected.stops[0].tour?.tour_date)} · ${value(selected.stops[0].suggested_time?.slice(0, 5))}` : "Nicht hinterlegt"}</strong></div>
                <div><span>Aufgaben</span><strong>{value(selected.stops[0]?.tasks)}</strong></div>
                <div><span>Hinweise</span><strong>{value(selected.stops[0]?.notes ?? selected.shifts[0]?.notes)}</strong></div>
                <div><span>Letzte eigene Notiz</span><strong>{value(selected.notes[0]?.content)}</strong></div>
              </div>
              <div className="location-actions">
                <button className="button secondary" type="button" onClick={() => setNoteTarget(selected)}><MessageSquarePlus size={15} />Notiz hinzufügen</button>
                {selected.stops.length > 0 ? <button className="button secondary" type="button" onClick={() => window.location.assign("/mitarbeiter/tour")}><Route size={15} />Tour öffnen</button> : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {noteTarget ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeNote}>
            <motion.div className="modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div><h2>Notiz hinzufügen</h2><p>{nameOf(noteTarget.client)}</p></div>
                <button className="icon-button" type="button" onClick={closeNote}><X size={18} /></button>
              </div>
              <div className="care-form">
                <label>Kategorie<select value={noteCategory} onChange={(event) => setNoteCategory(event.target.value)}>{noteCategories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                <label className="care-form-wide">Notiz<textarea rows={5} value={noteText} onChange={(event) => setNoteText(event.target.value)} /></label>
                <div className="care-form-actions"><button className="button" type="button" onClick={saveNote}>Notiz speichern</button></div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
