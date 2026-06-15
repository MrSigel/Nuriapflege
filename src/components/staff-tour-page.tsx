"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileUp,
  MapPin,
  MessageSquarePlus,
  Phone,
  Play,
  Route,
  SkipForward,
  SquareCheck,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { TourStatus, TourStopStatus } from "@/lib/tours";

type ClientInfo = {
  id: string;
  first_name: string;
  last_name: string;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
};

type StaffTourStop = {
  id: string;
  company_id: string;
  tour_id: string;
  client_id: string | null;
  shift_id: string | null;
  sort_order: number;
  suggested_time: string | null;
  tasks: string | null;
  notes: string | null;
  status: TourStopStatus;
  started_at: string | null;
  completed_at: string | null;
  client: ClientInfo | null;
};

type StaffTour = {
  id: string;
  company_id: string;
  location_id: string | null;
  employee_id: string | null;
  title: string;
  tour_date: string;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  status: TourStatus;
  notes: string | null;
  updated_at: string;
  location_name: string | null;
  stops: StaffTourStop[];
};

type ProfileContext = { companyId: string; userId: string };

const tourStatusLabels: Record<TourStatus, string> = { planned: "Geplant", in_progress: "Läuft", completed: "Erledigt", cancelled: "Abgesagt" };
const stopStatusLabels: Record<TourStopStatus, string> = { planned: "Geplant", in_progress: "Läuft", completed: "Erledigt", skipped: "Übersprungen", cancelled: "Abgesagt" };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function value(input: string | null | undefined) {
  return input && input.trim().length > 0 ? input : "Nicht hinterlegt";
}

function fullName(client: ClientInfo | null) {
  return client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt" : "Nicht hinterlegt";
}

function address(client: ClientInfo | null) {
  if (!client) return "Nicht hinterlegt";
  return [client.street, client.house_number, client.postal_code, client.city].filter(Boolean).join(" ") || "Nicht hinterlegt";
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${dateKey}T00:00:00`));
}

function timeOnly(date: Date) {
  return date.toTimeString().slice(0, 8);
}

function minutesBetween(startIso: string | null, end: Date) {
  if (!startIso) return 0;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function StaffTourPage() {
  const [date, setDate] = useState(todayKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const [tours, setTours] = useState<StaffTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>("");
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [noteStop, setNoteStop] = useState<StaffTourStop | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState("uebergabe");

  useEffect(() => {
    let active = true;

    async function loadTour() {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support.");
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
        setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support.");
        setLoading(false);
        return;
      }

      setProfile({ companyId: profileRow.company_id, userId: user.id });
      const { data: tourRows, error: tourError } = await supabase
        .from("tours")
        .select("id, company_id, location_id, employee_id, title, tour_date, suggested_start_time, suggested_end_time, status, notes, updated_at")
        .eq("company_id", profileRow.company_id)
        .eq("employee_id", user.id)
        .eq("tour_date", date)
        .order("suggested_start_time", { ascending: true });

      if (!active) return;
      if (tourError) {
        setError("Ihre Tour konnte nicht geladen werden.");
        setLoading(false);
        return;
      }

      const tourIds = (tourRows ?? []).map((tour) => tour.id);
      const locationIds = Array.from(new Set((tourRows ?? []).map((tour) => tour.location_id).filter(Boolean))) as string[];
      const [{ data: stopRows }, { data: locations }] = await Promise.all([
        tourIds.length
          ? supabase
              .from("tour_stops")
              .select("id, company_id, tour_id, client_id, shift_id, sort_order, suggested_time, tasks, notes, status, started_at, completed_at")
              .eq("company_id", profileRow.company_id)
              .in("tour_id", tourIds)
              .order("sort_order", { ascending: true })
          : Promise.resolve({ data: [] }),
        locationIds.length ? supabase.from("company_locations").select("id, name").eq("company_id", profileRow.company_id).in("id", locationIds) : Promise.resolve({ data: [] }),
      ]);

      const clientIds = Array.from(new Set((stopRows ?? []).map((stop) => stop.client_id).filter(Boolean))) as string[];
      const { data: clients } = clientIds.length
        ? await supabase
            .from("clients")
            .select("id, first_name, last_name, street, house_number, postal_code, city, phone")
            .eq("company_id", profileRow.company_id)
            .in("id", clientIds)
        : { data: [] };

      if (!active) return;
      const clientMap = new Map((clients ?? []).map((client) => [client.id, client as ClientInfo]));
      const locationMap = new Map((locations ?? []).map((location) => [location.id, location.name]));
      const stopsByTour = new Map<string, StaffTourStop[]>();

      for (const stop of stopRows ?? []) {
        const normalized = { ...stop, status: stop.status as TourStopStatus, client: stop.client_id ? clientMap.get(stop.client_id) ?? null : null };
        stopsByTour.set(stop.tour_id, [...(stopsByTour.get(stop.tour_id) ?? []), normalized]);
      }

      const normalizedTours = (tourRows ?? []).map((tour) => ({
        ...tour,
        status: tour.status as TourStatus,
        location_name: tour.location_id ? locationMap.get(tour.location_id) ?? null : null,
        stops: stopsByTour.get(tour.id) ?? [],
      }));

      setTours(normalizedTours);
      setSelectedTourId((current) => (current && normalizedTours.some((tour) => tour.id === current) ? current : normalizedTours[0]?.id ?? ""));
      setLoading(false);
    }

    loadTour();
    return () => {
      active = false;
    };
  }, [date]);

  const selectedTour = useMemo(() => tours.find((tour) => tour.id === selectedTourId) ?? tours[0] ?? null, [selectedTourId, tours]);
  const sortedStops = selectedTour?.stops ?? [];
  const activeStop = useMemo(() => {
    if (!selectedTour) return null;
    if (activeStopId) return sortedStops.find((stop) => stop.id === activeStopId) ?? null;
    return sortedStops.find((stop) => stop.status === "in_progress") ?? sortedStops.find((stop) => stop.status === "planned") ?? sortedStops[0] ?? null;
  }, [activeStopId, selectedTour, sortedStops]);
  const currentIndex = activeStop ? sortedStops.findIndex((stop) => stop.id === activeStop.id) : -1;
  const completedStops = sortedStops.filter((stop) => stop.status === "completed").length;
  const openStops = sortedStops.filter((stop) => stop.status === "planned" || stop.status === "in_progress").length;
  const canFinishTour = Boolean(selectedTour && sortedStops.length > 0 && sortedStops.every((stop) => stop.status === "completed" || stop.status === "skipped" || stop.status === "cancelled"));

  function moveDate(delta: number) {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + delta);
    setDate(toDateKey(next));
  }

  async function updateTourStatus(status: TourStatus) {
    if (!selectedTour || !profile) return;
    const message = status === "in_progress" ? "Möchten Sie diese Tour starten?" : "Möchten Sie die Tour abschließen?";
    if (!window.confirm(message)) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("tours").update({ status, updated_by: profile.userId }).eq("company_id", profile.companyId).eq("employee_id", profile.userId).eq("id", selectedTour.id);
    if (error) {
      setNotice("Tourstatus konnte nicht gespeichert werden.");
      return;
    }
    setTours((current) => current.map((tour) => (tour.id === selectedTour.id ? { ...tour, status } : tour)));
    setNotice(status === "completed" ? "Tour wurde abgeschlossen." : "Tour wurde gestartet.");
  }

  async function updateStop(stop: StaffTourStop, status: TourStopStatus) {
    if (!selectedTour || !profile) return;
    if (status === "completed" && !window.confirm("Möchten Sie diesen Tourstopp abschließen?")) return;
    if (status === "skipped" && !window.confirm("Möchten Sie diesen Tourstopp überspringen?")) return;
    const now = new Date();
    const patch: Record<string, string> = { status };
    if (status === "in_progress") patch.started_at = now.toISOString();
    if (status === "completed") patch.completed_at = now.toISOString();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("tour_stops").update(patch).eq("company_id", profile.companyId).eq("tour_id", selectedTour.id).eq("id", stop.id);
    if (error) {
      setNotice("Tourstopp konnte nicht gespeichert werden.");
      return;
    }

    if (status === "in_progress" || status === "completed") {
      const startIso = status === "in_progress" ? patch.started_at : stop.started_at;
      const startTime = startIso ? timeOnly(new Date(startIso)) : timeOnly(now);
      await supabase.from("time_entries").upsert(
        {
          company_id: profile.companyId,
          employee_id: profile.userId,
          client_id: stop.client_id,
          tour_id: selectedTour.id,
          tour_stop_id: stop.id,
          shift_id: stop.shift_id,
          entry_date: selectedTour.tour_date,
          start_time: startTime,
          end_time: status === "completed" ? timeOnly(now) : startTime,
          duration_minutes: status === "completed" ? minutesBetween(startIso ?? null, now) : 0,
          entry_type: "client_visit",
          status: "draft",
          source: "tour_wizard",
          created_by: profile.userId,
          updated_by: profile.userId,
        },
        { onConflict: "company_id,employee_id,tour_stop_id" },
      );
    }

    setTours((current) =>
      current.map((tour) =>
        tour.id === selectedTour.id
          ? { ...tour, stops: tour.stops.map((item) => (item.id === stop.id ? { ...item, ...patch, status } : item)) }
          : tour,
      ),
    );
    setNotice(status === "completed" ? "Tourstopp wurde abgeschlossen." : status === "in_progress" ? "Tourstopp wurde gestartet." : "Tourstopp wurde übersprungen.");
  }

  async function saveNote() {
    if (!profile || !selectedTour || !noteStop || !noteStop.client_id || noteText.trim().length === 0) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("care_documentation").insert({
      company_id: profile.companyId,
      client_id: noteStop.client_id,
      employee_id: profile.userId,
      tour_id: selectedTour.id,
      tour_stop_id: noteStop.id,
      documentation_date: selectedTour.tour_date,
      documentation_time: timeOnly(new Date()),
      category: noteCategory,
      title: noteCategory === "uebergabe" ? "Übergabe" : "Tournotiz",
      content: noteText.trim(),
      status: "draft",
      visibility: "care_team",
      created_by: profile.userId,
      updated_by: profile.userId,
    });
    if (error) {
      setNotice("Notiz konnte nicht gespeichert werden.");
      return;
    }
    setNotice("Notiz wurde gespeichert.");
    setNoteStop(null);
    setNoteText("");
  }

  return (
    <motion.section className="page staff-tour-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="tours-header">
        <div><h1>Meine Tour</h1><p>Ihre heutige Tour und zugewiesenen Patienten.</p></div>
        <div className="tours-header-actions">
          {selectedTour?.status === "planned" ? <button className="button" type="button" onClick={() => updateTourStatus("in_progress")}><Play size={16} />Tour starten</button> : null}
          {canFinishTour && selectedTour?.status !== "completed" ? <button className="button" type="button" onClick={() => updateTourStatus("completed")}><SquareCheck size={16} />Tour beenden</button> : null}
        </div>
      </div>

      <motion.div className="shift-viewbar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <button className="button secondary icon-only" type="button" onClick={() => moveDate(-1)} aria-label="Vorheriger Tag"><ChevronLeft size={17} /></button>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button className="button secondary" type="button" onClick={() => setDate(todayKey())}>Heute</button>
        <button className="button secondary icon-only" type="button" onClick={() => moveDate(1)} aria-label="Nächster Tag"><ChevronRight size={17} /></button>
        {tours.length > 1 ? <select value={selectedTourId} onChange={(event) => setSelectedTourId(event.target.value)}>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.title}</option>)}</select> : null}
      </motion.div>

      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}

      {error ? (
        <motion.div className="empty-state"><h2>Meine Tour</h2><p>{error}</p></motion.div>
      ) : loading ? (
        <motion.div className="empty-state"><h2>Tour wird geladen</h2></motion.div>
      ) : !selectedTour ? (
        <motion.div className="empty-state"><h2>Keine Tour geplant.</h2><p>Sobald Ihnen eine Tour zugewiesen wird, erscheint sie hier.</p></motion.div>
      ) : (
        <>
          <motion.article className="tour-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="tour-card-header"><div><span>{formatDate(selectedTour.tour_date)} · {value(selectedTour.suggested_start_time)} - {value(selectedTour.suggested_end_time)}</span><h2>{selectedTour.title}</h2></div><span className={`shift-status ${selectedTour.status}`}>{tourStatusLabels[selectedTour.status]}</span></div>
            <div className="tour-details-grid"><div><span>Stopps</span><strong>{sortedStops.length}</strong></div><div><span>Erledigt</span><strong>{completedStops}</strong></div><div><span>Offen</span><strong>{openStops}</strong></div><div><span>Standort</span><strong>{value(selectedTour.location_name)}</strong></div><div><span>Notiz</span><strong>{value(selectedTour.notes)}</strong></div></div>
          </motion.article>

          {activeStop ? (
            <motion.article className="tour-card current-stop-card" key={activeStop.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="tour-card-header"><div><span>{currentIndex + 1} von {sortedStops.length} · {value(activeStop.suggested_time)}</span><h2>{fullName(activeStop.client)}</h2></div><span className={`shift-status ${activeStop.status}`}>{stopStatusLabels[activeStop.status]}</span></div>
              <div className="tour-details-grid"><div><span>Adresse</span><strong>{address(activeStop.client)}</strong></div><div><span>Telefon</span><strong>{value(activeStop.client?.phone)}</strong></div><div><span>Aufgaben</span><strong>{value(activeStop.tasks)}</strong></div><div><span>Hinweise</span><strong>{value(activeStop.notes)}</strong></div></div>
              <div className="location-actions">
                {activeStop.status === "planned" ? <button className="button" type="button" onClick={() => updateStop(activeStop, "in_progress")}><Play size={15} />Stopp starten</button> : null}
                {activeStop.status === "in_progress" ? <button className="button" type="button" onClick={() => updateStop(activeStop, "completed")}><CheckCircle2 size={15} />Stopp abschließen</button> : null}
                <button className="button secondary" type="button" disabled={activeStop.status !== "completed"} onClick={() => setActiveStopId(sortedStops.find((stop, index) => index > currentIndex && stop.status !== "completed")?.id ?? null)}><Route size={15} />Nächster Patient</button>
                <button className="button secondary" type="button" onClick={() => setNoteStop(activeStop)}><MessageSquarePlus size={15} />Notiz hinzufügen</button>
                <button className="button secondary" type="button" disabled title="Dokumentenupload wird vorbereitet."><FileUp size={15} />Dokumentenupload wird vorbereitet.</button>
                {activeStop.status === "planned" ? <button className="button secondary" type="button" onClick={() => updateStop(activeStop, "skipped")}><SkipForward size={15} />Überspringen</button> : null}
              </div>
            </motion.article>
          ) : null}

          <motion.div className="tour-stops-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {sortedStops.map((stop) => (
              <motion.button className={`tour-stop-row ${activeStop?.id === stop.id ? "active" : ""}`} key={stop.id} type="button" onClick={() => setActiveStopId(stop.id)} whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                <strong>{stop.sort_order}. {fullName(stop.client)}</strong>
                <span>{value(stop.suggested_time)} · {stopStatusLabels[stop.status]}</span>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {noteStop ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => noteText ? window.confirm("Änderungen verwerfen?") && setNoteStop(null) : setNoteStop(null)}>
            <motion.div className="modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}>
              <div className="modal-header"><div><h2>Notiz hinzufügen</h2><p>{fullName(noteStop.client)}</p></div><button className="icon-button" type="button" onClick={() => noteText ? window.confirm("Änderungen verwerfen?") && setNoteStop(null) : setNoteStop(null)}><X size={18} /></button></div>
              <div className="care-form">
                <label>Kategorie<select value={noteCategory} onChange={(event) => setNoteCategory(event.target.value)}><option value="uebergabe">Übergabe</option><option value="beobachtung">Beobachtung</option><option value="sonstiges">Sonstiges</option></select></label>
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
