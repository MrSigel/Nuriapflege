"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Route, X } from "lucide-react";
import { useState } from "react";
import type { TourRecord, ToursData } from "@/lib/tours";

type TourModalProps = {
  action: (formData: FormData) => void;
  buttonLabel: string;
  submitLabel: string;
  data: Pick<ToursData, "employees" | "locations" | "today">;
  tour?: TourRecord;
};

export function TourModal({ action, buttonLabel, submitLabel, data, tour }: TourModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        {tour ? <Pencil size={16} /> : <Route size={16} />}
        {buttonLabel}
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-panel tour-modal-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="modal-header">
                <div><h2>{buttonLabel}</h2><p>Tour, Zuweisungen und vorgeschlagene Zeiten verwalten.</p></div>
                <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Schließen"><X size={18} /></button>
              </div>
              <form action={action} className="tour-form">
                {tour ? <input name="id" type="hidden" value={tour.id} /> : null}
                <label>Titel<input name="title" required defaultValue={tour?.title ?? ""} /></label>
                <label>Datum<input name="tour_date" type="date" required defaultValue={tour?.tour_date ?? data.today} /></label>
                <label>Vorgeschlagene Startzeit<input name="suggested_start_time" type="time" defaultValue={tour?.suggested_start_time ?? ""} /></label>
                <label>Vorgeschlagene Endzeit<input name="suggested_end_time" type="time" defaultValue={tour?.suggested_end_time ?? ""} /></label>
                <label>Standort<select name="location_id" defaultValue={tour?.location_id ?? ""}><option value="">Kein Standort</option>{data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                <label>Mitarbeiter<select name="employee_id" defaultValue={tour?.employee_id ?? ""}><option value="">Kein Mitarbeiter</option>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
                <label>Status<select name="status" required defaultValue={tour?.status ?? "planned"}><option value="planned">Geplant</option><option value="in_progress">Läuft</option><option value="completed">Erledigt</option><option value="cancelled">Abgesagt</option></select></label>
                {data.employees.length === 0 ? <p>Noch keine Mitarbeiter vorhanden. Bitte zuerst Mitarbeiter anlegen.</p> : null}
                {data.locations.length === 0 ? <p>Noch keine Standorte vorhanden. Bitte zuerst Standort anlegen.</p> : null}
                <label className="tour-form-wide">Notizen<textarea name="notes" rows={4} defaultValue={tour?.notes ?? ""} /></label>
                <div className="tour-form-actions"><button className="button secondary" type="button" onClick={() => setOpen(false)}>Abbrechen</button><button className="button" type="submit">{submitLabel}</button></div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
