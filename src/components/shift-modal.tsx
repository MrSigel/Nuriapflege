"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { ShiftsData, ShiftRecord } from "@/lib/shifts";

type ShiftModalProps = {
  action: (formData: FormData) => void;
  buttonLabel: string;
  submitLabel: string;
  data: Pick<ShiftsData, "employees" | "clients" | "locations" | "today">;
  shift?: ShiftRecord;
};

export function ShiftModal({ action, buttonLabel, submitLabel, data, shift }: ShiftModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        {shift ? <Pencil size={16} /> : <CalendarPlus size={16} />}
        {buttonLabel}
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-panel shift-modal-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="modal-header">
                <div>
                  <h2>{buttonLabel}</h2>
                  <p>Dienst, Zuweisungen und vorgeschlagene Zeiten verwalten.</p>
                </div>
                <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Schließen"><X size={18} /></button>
              </div>
              <form action={action} className="shift-form">
                {shift ? <input name="id" type="hidden" value={shift.id} /> : null}
                <label>Titel<input name="title" required defaultValue={shift?.title ?? ""} /></label>
                <label>Datum<input name="date" type="date" required defaultValue={shift?.date ?? data.today} /></label>
                <label>Vorgeschlagene Startzeit<input name="suggested_start_time" type="time" defaultValue={shift?.suggested_start_time ?? ""} /></label>
                <label>Vorgeschlagene Endzeit<input name="suggested_end_time" type="time" defaultValue={shift?.suggested_end_time ?? ""} /></label>
                <label>Diensttyp<select name="shift_type" required defaultValue={shift?.shift_type ?? "pflegeeinsatz"}><option value="pflegeeinsatz">Pflegeeinsatz</option><option value="hauswirtschaft">Hauswirtschaft</option><option value="beratung">Beratung</option><option value="verwaltung">Verwaltung</option><option value="bereitschaft">Bereitschaft</option><option value="sonstiges">Sonstiges</option></select></label>
                <label>Status<select name="status" required defaultValue={shift?.status ?? "planned"}><option value="planned">Geplant</option><option value="in_progress">Läuft</option><option value="completed">Erledigt</option><option value="cancelled">Abgesagt</option></select></label>
                <label>Standort<select name="location_id" defaultValue={shift?.location_id ?? ""}><option value="">Kein Standort</option>{data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                <label>Mitarbeiter<select name="employee_id" defaultValue={shift?.employee_id ?? ""}><option value="">Kein Mitarbeiter</option>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
                <label>Klient<select name="client_id" defaultValue={shift?.client_id ?? ""}><option value="">Kein Klient</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
                {data.employees.length === 0 ? <p>Noch keine Mitarbeiter vorhanden. Bitte zuerst Mitarbeiter anlegen.</p> : null}
                {data.clients.length === 0 ? <p>Noch keine Klienten vorhanden. Bitte zuerst Klient anlegen.</p> : null}
                {data.locations.length === 0 ? <p>Noch keine Standorte vorhanden. Bitte zuerst Standort anlegen.</p> : null}
                <label className="shift-form-wide">Notizen<textarea name="notes" rows={4} defaultValue={shift?.notes ?? ""} /></label>
                <div className="shift-form-actions">
                  <button className="button secondary" type="button" onClick={() => setOpen(false)}>Abbrechen</button>
                  <button className="button" type="submit">{submitLabel}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
