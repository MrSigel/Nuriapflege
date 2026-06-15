"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock3, Download, Eye, FilterX, PauseCircle, Plus, Route, Search, UserRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { TourModal } from "@/components/tour-modal";
import type { TourRecord, ToursData, TourStatus, TourStopStatus } from "@/lib/tours";

type ToursPageProps = {
  data: ToursData;
  actions: {
    createTour: (formData: FormData) => void;
    updateTour: (formData: FormData) => void;
    changeTourStatus: (formData: FormData) => void;
    upsertTourStop: (formData: FormData) => void;
    deleteTourStop: (formData: FormData) => void;
    moveTourStop: (formData: FormData) => void;
  };
};

const statusLabels: Record<TourStatus, string> = { planned: "Geplant", in_progress: "Läuft", completed: "Erledigt", cancelled: "Abgesagt" };
const stopLabels: Record<TourStopStatus, string> = { planned: "Geplant", in_progress: "Läuft", completed: "Erledigt", skipped: "Übersprungen", cancelled: "Abgesagt" };

function value(text: string | null | undefined) {
  return text && text.trim().length > 0 ? text : "Nicht hinterlegt";
}

function key(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeFor(view: "day" | "week", selectedDate: string) {
  if (view === "day") return { start: selectedDate, end: selectedDate };
  const date = new Date(`${selectedDate}T00:00:00`);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: key(start), end: key(end) };
}

function StopForm({ tour, actions, data }: { tour: TourRecord; actions: ToursPageProps["actions"]; data: ToursData }) {
  return (
    <form action={actions.upsertTourStop} className="tour-stop-form">
      <input name="tour_id" type="hidden" value={tour.id} />
      <label>Klient<select name="client_id" required><option value="">Klient wählen</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label>Dienst<select name="shift_id"><option value="">Kein Dienst</option>{data.shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.title} · {shift.date}</option>)}</select></label>
      <label>Reihenfolge<input name="sort_order" type="number" min="0" defaultValue={tour.stops.length + 1} /></label>
      <label>Uhrzeit<input name="suggested_time" type="time" /></label>
      <label>Status<select name="status" defaultValue="planned"><option value="planned">Geplant</option><option value="in_progress">Läuft</option><option value="completed">Erledigt</option><option value="skipped">Übersprungen</option><option value="cancelled">Abgesagt</option></select></label>
      <label>Aufgaben<input name="tasks" /></label>
      <label className="tour-form-wide">Notizen<textarea name="notes" rows={2} /></label>
      {data.clients.length === 0 ? <p>Noch keine Klienten vorhanden. Bitte zuerst Klient anlegen.</p> : null}
      {data.shifts.length === 0 ? <p>Noch keine Dienste vorhanden. Tourstopps können auch ohne Dienst angelegt werden.</p> : null}
      <button className="button" type="submit"><Plus size={16} />Tourstopp hinzufügen</button>
    </form>
  );
}

export function ToursPage({ data, actions }: ToursPageProps) {
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(data.today);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const selectedRange = rangeFor(view, selectedDate);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return data.tours.filter((tour) => {
      const haystack = [tour.title, tour.employee_name, tour.location_name, tour.notes, ...tour.stops.map((stop) => stop.client_name)].filter(Boolean).join(" ").toLowerCase();
      return tour.tour_date >= selectedRange.start && tour.tour_date <= selectedRange.end && (!search || haystack.includes(search)) && (status === "all" || tour.status === status) && (employeeId === "all" || (employeeId === "none" ? !tour.employee_id : tour.employee_id === employeeId)) && (locationId === "all" || (locationId === "none" ? !tour.location_id : tour.location_id === locationId));
    });
  }, [data.tours, employeeId, locationId, query, selectedRange.end, selectedRange.start, status]);

  const stats = [["Touren heute", data.stats.today, Route], ["Touren diese Woche", data.stats.week, Route], ["Geplante Touren", data.stats.planned, Clock3], ["Laufende Touren", data.stats.inProgress, PauseCircle], ["Erledigte Touren", data.stats.completed, CheckCircle2], ["Abgesagte Touren", data.stats.cancelled, XCircle], ["Ohne Mitarbeiter", data.stats.withoutEmployee, UserRound], ["Offene Tourstopps", data.stats.openStops, Route]] as const;

  function move(delta: number) {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + (view === "day" ? delta : delta * 7));
    setSelectedDate(key(date));
  }

  return (
    <motion.section className="page tours-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="tours-header"><div><h1>Tourenplanung</h1><p>Planen und verwalten Sie Touren, Tourstopps, Mitarbeitende und Klienten Ihres Pflegedienstes.</p></div><div className="tours-header-actions"><TourModal action={actions.createTour} buttonLabel="Tour anlegen" submitLabel="Tour anlegen" data={data} /><button className="button secondary" disabled title="Export wird vorbereitet." type="button"><Download size={16} />Touren exportieren</button></div></div>
      <div className="tour-stats-grid">{stats.map(([label, count, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{count}</strong></motion.div>)}</div>
      <motion.div className="tour-viewbar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><div className="segmented"><button className={view === "day" ? "active" : ""} type="button" onClick={() => setView("day")}>Tag</button><button className={view === "week" ? "active" : ""} type="button" onClick={() => setView("week")}>Woche</button></div><button className="button secondary" type="button" onClick={() => move(-1)}>Zurück</button><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /><button className="button secondary" type="button" onClick={() => setSelectedDate(data.today)}>Heute</button><button className="button secondary" type="button" onClick={() => move(1)}>Weiter</button></motion.div>
      <motion.div className="tour-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tourtitel, Mitarbeiter, Klient, Ort, Notiz" /></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Mitarbeiter<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Mitarbeiter</option>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label>Standort<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Standort</option>{data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><button className="button secondary" type="button" onClick={() => { setQuery(""); setStatus("all"); setEmployeeId("all"); setLocationId("all"); }}><FilterX size={16} />Zurücksetzen</button></motion.div>
      <AnimatePresence mode="wait">{data.tours.length === 0 ? null : <motion.div className="tours-list" key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{filtered.map((tour) => {
        const openStops = tour.stops.filter((stop) => stop.status === "planned" || stop.status === "in_progress").length;
        const doneStops = tour.stops.filter((stop) => stop.status === "completed").length;
        return <motion.article className="tour-card" key={tour.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><div className="tour-card-header"><div><span>{new Intl.DateTimeFormat("de-DE").format(new Date(tour.tour_date))} · {value(tour.suggested_start_time)} - {value(tour.suggested_end_time)}</span><h2>{tour.title}</h2></div><span className={`shift-status ${tour.status}`}>{statusLabels[tour.status]}</span></div><div className="tour-details-grid"><div><span>Mitarbeiter</span><strong>{value(tour.employee_name)}</strong></div><div><span>Standort</span><strong>{value(tour.location_name)}</strong></div><div><span>Stopps</span><strong>{tour.stops.length}</strong></div><div><span>Offen / erledigt</span><strong>{openStops} / {doneStops}</strong></div><div><span>Notiz</span><strong>{value(tour.notes)}</strong></div></div><div className="location-actions"><details><summary><Eye size={15} />Ansehen</summary><div className="location-detail-panel tour-detail-panel"><p>Titel: {tour.title}</p><p>Datum: {new Intl.DateTimeFormat("de-DE").format(new Date(tour.tour_date))}</p><p>Zeiten: {value(tour.suggested_start_time)} - {value(tour.suggested_end_time)}</p><p>Status: {statusLabels[tour.status]}</p><p>Mitarbeiter: {value(tour.employee_name)}</p><p>Standort: {value(tour.location_name)}</p><p>Anzahl Stopps: {tour.stops.length}</p><p>Offene Stopps: {openStops}</p><p>Erledigte Stopps: {doneStops}</p><p>Notizen: {value(tour.notes)}</p><p>Erstellt von: {value(tour.created_by_name)}</p><p>Zuletzt aktualisiert: {new Intl.DateTimeFormat("de-DE").format(new Date(tour.updated_at))}</p><div className="tour-stops-list">{tour.stops.map((stop) => <motion.div className="tour-stop-row" key={stop.id} layout><strong>{stop.sort_order}. {value(stop.client_name)}</strong><span>{value(stop.suggested_time)} · {stopLabels[stop.status]}</span><p>{value(stop.tasks)} · {value(stop.notes)}</p><div className="actions"><form action={actions.moveTourStop}><input name="id" type="hidden" value={stop.id} /><input name="sort_order" type="hidden" value={stop.sort_order} /><input name="direction" type="hidden" value="up" /><button className="button secondary" type="submit">Hoch</button></form><form action={actions.moveTourStop}><input name="id" type="hidden" value={stop.id} /><input name="sort_order" type="hidden" value={stop.sort_order} /><input name="direction" type="hidden" value="down" /><button className="button secondary" type="submit">Runter</button></form><form action={actions.deleteTourStop}><input name="id" type="hidden" value={stop.id} /><button className="button secondary" type="submit">Entfernen</button></form></div></motion.div>)}</div><StopForm tour={tour} actions={actions} data={data} /></div></details><TourModal action={actions.updateTour} buttonLabel="Bearbeiten" submitLabel="Änderungen speichern" data={data} tour={tour} />{(["planned", "in_progress", "completed", "cancelled"] as TourStatus[]).filter((next) => next !== tour.status).map((next) => <form action={actions.changeTourStatus} key={next}><input name="id" type="hidden" value={tour.id} /><input name="status" type="hidden" value={next} /><button className="button secondary" type="submit">{statusLabels[next]} setzen</button></form>)}</div></motion.article>;
      })}</motion.div>}</AnimatePresence>
    </motion.section>
  );
}
