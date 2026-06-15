"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { TimeEntry, TimeTrackingData } from "@/lib/time-tracking";

type Props = { action: (formData: FormData) => void; buttonLabel: string; submitLabel: string; data: TimeTrackingData; entry?: TimeEntry };
function calc(start: string, end: string, br: number) { if (!start || !end || start > end) return 0; const [sh, sm] = start.split(":").map(Number); const [eh, em] = end.split(":").map(Number); return Math.max(0, eh * 60 + em - (sh * 60 + sm) - br); }
function fmt(min: number) { return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")} Std.`; }

export function TimeEntryModal({ action, buttonLabel, submitLabel, data, entry }: Props) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(entry?.start_time ?? "");
  const [end, setEnd] = useState(entry?.end_time ?? "");
  const [br, setBr] = useState(entry?.break_minutes ?? 0);
  const duration = useMemo(() => calc(start, end, br), [br, end, start]);
  return <>
    <motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>{entry ? <Pencil size={16} /> : <Clock size={16} />}{buttonLabel}</motion.button>
    <AnimatePresence>{open ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="modal-panel time-modal-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><div className="modal-header"><div><h2>{buttonLabel}</h2><p>Arbeitszeit, Einsatzbezug und Nachweisstatus verwalten.</p></div><button className="modal-close" type="button" onClick={() => setOpen(false)}><X size={18} /></button></div><form action={action} className="time-form">
      {entry ? <input name="id" type="hidden" value={entry.id} /> : null}
      <label>Mitarbeiter<select name="employee_id" required defaultValue={entry?.employee_id ?? ""}><option value="">Mitarbeiter wählen</option>{data.employees.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>Datum<input name="entry_date" type="date" required defaultValue={entry?.entry_date ?? data.today} /></label>
      <label>Startzeit<input name="start_time" type="time" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
      <label>Endzeit<input name="end_time" type="time" required value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      <label>Pause in Minuten<input name="break_minutes" type="number" min="0" value={br} onChange={(e) => setBr(Number(e.target.value))} /></label>
      <div className="time-duration-preview"><span>Dauer</span><strong>{fmt(duration)}</strong></div>
      <label>Eintragstyp<select name="entry_type" required defaultValue={entry?.entry_type ?? "work_time"}><option value="work_time">Arbeitszeit</option><option value="client_visit">Klientenbesuch</option><option value="tour_time">Tourzeit</option><option value="break">Pause</option><option value="admin_time">Verwaltungszeit</option><option value="other">Sonstiges</option></select></label>
      <label>Status<select name="status" required defaultValue={entry?.status ?? "draft"}><option value="draft">Entwurf</option><option value="submitted">Eingereicht</option><option value="approved">Freigegeben</option><option value="rejected">Abgelehnt</option><option value="corrected">Korrigiert</option></select></label>
      <label>Quelle<select name="source" defaultValue={entry?.source ?? "manual"}><option value="manual">Manuell</option><option value="tour_wizard">Tour-Wizard</option><option value="system">System</option></select></label>
      <label>Standort<select name="location_id" defaultValue={entry?.location_id ?? ""}><option value="">Kein Standort</option>{data.locations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>Klient<select name="client_id" defaultValue={entry?.client_id ?? ""}><option value="">Kein Klient</option>{data.clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>Dienst<select name="shift_id" defaultValue={entry?.shift_id ?? ""}><option value="">Kein Dienst</option>{data.shifts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>Tour<select name="tour_id" defaultValue={entry?.tour_id ?? ""}><option value="">Keine Tour</option>{data.tours.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>Tourstopp<select name="tour_stop_id" defaultValue={entry?.tour_stop_id ?? ""}><option value="">Kein Tourstopp</option>{data.tourStops.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      {data.employees.length === 0 ? <p>Noch keine Mitarbeiter vorhanden. Bitte zuerst Mitarbeiter anlegen.</p> : null}
      <label className="time-form-wide">Notizen<textarea name="notes" rows={4} defaultValue={entry?.notes ?? ""} /></label><div className="time-form-actions"><button className="button secondary" type="button" onClick={() => setOpen(false)}>Abbrechen</button><button className="button" type="submit">{submitLabel}</button></div>
    </form></motion.div></motion.div> : null}</AnimatePresence>
  </>;
}
