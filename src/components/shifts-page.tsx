"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock3, Download, Eye, FilterX, PauseCircle, Search, UserRound, Users, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmActionDialog } from "@/components/action-dialogs";
import { ShiftModal } from "@/components/shift-modal";
import type { ShiftsData, ShiftStatus, ShiftType } from "@/lib/shifts";

type ShiftsPageProps = {
  data: ShiftsData;
  actions: {
    createShift: (formData: FormData) => void;
    updateShift: (formData: FormData) => void;
    changeShiftStatus: (formData: FormData) => void;
  };
};

const statusLabels: Record<ShiftStatus, string> = { planned: "Geplant", in_progress: "Läuft", completed: "Erledigt", cancelled: "Abgesagt" };
const typeLabels: Record<ShiftType, string> = { pflegeeinsatz: "Pflegeeinsatz", hauswirtschaft: "Hauswirtschaft", beratung: "Beratung", verwaltung: "Verwaltung", bereitschaft: "Bereitschaft", sonstiges: "Sonstiges" };

function value(text: string | null | undefined) {
  return text && text.trim().length > 0 ? text : "Nicht hinterlegt";
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeFor(view: string, selectedDate: string) {
  const date = new Date(`${selectedDate}T00:00:00`);
  if (view === "day") return { start: selectedDate, end: selectedDate };
  if (view === "week") {
    const day = date.getDay() || 7;
    const start = new Date(date);
    start.setDate(date.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toDateKey(start), end: toDateKey(end) };
  }
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function ShiftsPage({ data, actions }: ShiftsPageProps) {
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(data.today);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [shiftType, setShiftType] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [locationId, setLocationId] = useState("all");

  const selectedRange = rangeFor(view, selectedDate);
  const filteredShifts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return data.shifts.filter((shift) => {
      const haystack = [shift.title, shift.employee_name, shift.client_name, shift.location_name, shift.notes].filter(Boolean).join(" ").toLowerCase();
      return (
        shift.date >= selectedRange.start &&
        shift.date <= selectedRange.end &&
        (!search || haystack.includes(search)) &&
        (status === "all" || shift.status === status) &&
        (shiftType === "all" || shift.shift_type === shiftType) &&
        (employeeId === "all" || (employeeId === "none" ? !shift.employee_id : shift.employee_id === employeeId)) &&
        (clientId === "all" || (clientId === "none" ? !shift.client_id : shift.client_id === clientId)) &&
        (locationId === "all" || (locationId === "none" ? !shift.location_id : shift.location_id === locationId))
      );
    });
  }, [clientId, data.shifts, employeeId, locationId, query, selectedRange.end, selectedRange.start, shiftType, status]);

  const stats = [
    ["Dienste heute", data.stats.today, CalendarDays],
    ["Dienste diese Woche", data.stats.week, CalendarDays],
    ["Geplante Dienste", data.stats.planned, Clock3],
    ["Laufende Dienste", data.stats.inProgress, PauseCircle],
    ["Erledigte Dienste", data.stats.completed, CheckCircle2],
    ["Abgesagte Dienste", data.stats.cancelled, XCircle],
    ["Ohne Mitarbeiter", data.stats.withoutEmployee, UserRound],
    ["Ohne Klient", data.stats.withoutClient, Users],
  ] as const;

  function move(delta: number) {
    const date = new Date(`${selectedDate}T00:00:00`);
    if (view === "day") date.setDate(date.getDate() + delta);
    if (view === "week") date.setDate(date.getDate() + delta * 7);
    if (view === "month") date.setMonth(date.getMonth() + delta);
    setSelectedDate(toDateKey(date));
  }

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setShiftType("all");
    setEmployeeId("all");
    setClientId("all");
    setLocationId("all");
  }

  return (
    <motion.section className="page shifts-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="shifts-header">
        <div><h1>Dienstplanung</h1><p>Planen und verwalten Sie Dienste, Mitarbeitende, Klienten und Standorte Ihres Pflegedienstes.</p></div>
        <div className="shifts-header-actions">
          <ShiftModal action={actions.createShift} buttonLabel="Dienst anlegen" submitLabel="Dienst anlegen" data={data} />
          <button className="button secondary" disabled title="Export wird vorbereitet." type="button"><Download size={16} />Dienstplan exportieren</button>
        </div>
      </div>
      <div className="shift-stats-grid">{stats.map(([label, count, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{count}</strong></motion.div>)}</div>
      <motion.div className="shift-viewbar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="segmented">{(["day", "week", "month"] as const).map((item) => <button className={view === item ? "active" : ""} key={item} type="button" onClick={() => setView(item)}>{item === "day" ? "Tag" : item === "week" ? "Woche" : "Monat"}</button>)}</div>
        <button className="button secondary" type="button" onClick={() => move(-1)}>Zurück</button>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        <button className="button secondary" type="button" onClick={() => setSelectedDate(data.today)}>Heute</button>
        <button className="button secondary" type="button" onClick={() => move(1)}>Weiter</button>
      </motion.div>
      <motion.div className="shift-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Mitarbeiter, Klient, Ort, Notiz" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Diensttyp<select value={shiftType} onChange={(event) => setShiftType(event.target.value)}><option value="all">Alle</option>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Mitarbeiter<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Mitarbeiter</option>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
        <label>Klient<select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Klient</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label>Standort<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Standort</option>{data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <button className="button secondary" type="button" onClick={resetFilters}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>
      <AnimatePresence mode="wait">
        {data.shifts.length === 0 ? null : (
          <motion.div className="shifts-list" key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filteredShifts.map((shift) => (
              <motion.article className="shift-card" key={shift.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="shift-card-header"><div><span>{new Intl.DateTimeFormat("de-DE").format(new Date(shift.date))} · {value(shift.suggested_start_time)} - {value(shift.suggested_end_time)}</span><h2>{shift.title}</h2></div><div className="client-badges"><span className={`shift-type-badge type-${shift.shift_type}`}>{typeLabels[shift.shift_type]}</span><span className={`shift-status ${shift.status}`}>{statusLabels[shift.status]}</span></div></div>
                <div className="shift-details-grid"><div><span>Mitarbeiter</span><strong>{value(shift.employee_name)}</strong></div><div><span>Klient</span><strong>{value(shift.client_name)}</strong></div><div><span>Standort</span><strong>{value(shift.location_name)}</strong></div><div><span>Notiz</span><strong>{value(shift.notes)}</strong></div></div>
                <div className="location-actions">
                  <details><summary><Eye size={15} />Ansehen</summary><div className="location-detail-panel"><p>Titel: {shift.title}</p><p>Datum: {new Intl.DateTimeFormat("de-DE").format(new Date(shift.date))}</p><p>Zeiten: {value(shift.suggested_start_time)} - {value(shift.suggested_end_time)}</p><p>Status: {statusLabels[shift.status]}</p><p>Diensttyp: {typeLabels[shift.shift_type]}</p><p>Mitarbeiter: {value(shift.employee_name)}</p><p>Klient: {value(shift.client_name)}</p><p>Standort: {value(shift.location_name)}</p><p>Notizen: {value(shift.notes)}</p><p>Erstellt von: {value(shift.created_by_name)}</p><p>Zuletzt aktualisiert: {new Intl.DateTimeFormat("de-DE").format(new Date(shift.updated_at))}</p></div></details>
                  <ShiftModal action={actions.updateShift} buttonLabel="Bearbeiten" submitLabel="Änderungen speichern" data={data} shift={shift} />
                  {(["planned", "in_progress", "completed", "cancelled"] as ShiftStatus[]).filter((next) => next !== shift.status).map((next) => <ConfirmActionDialog action={actions.changeShiftStatus} buttonLabel={`${statusLabels[next]} setzen`} description="Bitte bestätigen Sie die Statusänderung für diesen Dienst." hiddenFields={[{ name: "id", value: shift.id }, { name: "status", value: next }]} key={next} title="Status ändern" />)}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
