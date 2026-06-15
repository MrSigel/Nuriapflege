"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import type { ClientLocation, ClientRecord } from "@/lib/clients";

type ClientModalProps = {
  action: (formData: FormData) => void;
  buttonLabel: string;
  submitLabel: string;
  locations: ClientLocation[];
  client?: ClientRecord;
};

export function ClientModal({ action, buttonLabel, submitLabel, locations, client }: ClientModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        {client ? <Pencil size={16} /> : <Plus size={16} />}
        {buttonLabel}
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="modal-header">
                <div>
                  <h2>{buttonLabel}</h2>
                  <p>Stammdaten, Kontakt, Pflegegrunddaten und Organisation verwalten.</p>
                </div>
                <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Schließen">
                  <X size={18} />
                </button>
              </div>
              <form action={action} className="client-form">
                {client ? <input name="id" type="hidden" value={client.id} /> : null}
                <fieldset>
                  <legend>Stammdaten</legend>
                  <label>Klientennummer<input name="client_number" defaultValue={client?.client_number ?? ""} /></label>
                  <label>Vorname<input name="first_name" required defaultValue={client?.first_name ?? ""} /></label>
                  <label>Nachname<input name="last_name" required defaultValue={client?.last_name ?? ""} /></label>
                  <label>Geburtsdatum<input name="date_of_birth" type="date" defaultValue={client?.date_of_birth ?? ""} /></label>
                  <label>Geschlecht<input name="gender" defaultValue={client?.gender ?? ""} /></label>
                  <label>Status<select name="status" required defaultValue={client?.status ?? "active"}><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="inactive">Inaktiv</option></select></label>
                </fieldset>
                <fieldset>
                  <legend>Adresse & Kontakt</legend>
                  <label>Straße<input name="street" defaultValue={client?.street ?? ""} /></label>
                  <label>Hausnummer<input name="house_number" defaultValue={client?.house_number ?? ""} /></label>
                  <label>PLZ<input name="postal_code" defaultValue={client?.postal_code ?? ""} /></label>
                  <label>Ort<input name="city" defaultValue={client?.city ?? ""} /></label>
                  <label>Telefonnummer<input name="phone" defaultValue={client?.phone ?? ""} /></label>
                  <label>E-Mail<input name="email" type="email" defaultValue={client?.email ?? ""} /></label>
                </fieldset>
                <fieldset>
                  <legend>Pflegegrunddaten</legend>
                  <label>Pflegegrad<select name="care_level" defaultValue={client?.care_level ?? "unknown"}><option value="none">kein Pflegegrad</option><option value="1">Pflegegrad 1</option><option value="2">Pflegegrad 2</option><option value="3">Pflegegrad 3</option><option value="4">Pflegegrad 4</option><option value="5">Pflegegrad 5</option><option value="applied">beantragt</option><option value="unknown">unbekannt</option></select></label>
                  <label>Krankenkasse / Kostenträger<input name="insurance_provider" defaultValue={client?.insurance_provider ?? ""} /></label>
                  <label>Versicherungsnummer<input name="insurance_number" defaultValue={client?.insurance_number ?? ""} /></label>
                </fieldset>
                <fieldset>
                  <legend>Ansprechpartner</legend>
                  <label>Hauptansprechpartner Name<input name="primary_contact_name" defaultValue={client?.primary_contact_name ?? ""} /></label>
                  <label>Verhältnis / Beziehung<input name="primary_contact_relation" defaultValue={client?.primary_contact_relation ?? ""} /></label>
                  <label>Telefonnummer<input name="primary_contact_phone" defaultValue={client?.primary_contact_phone ?? ""} /></label>
                  <label>E-Mail<input name="primary_contact_email" type="email" defaultValue={client?.primary_contact_email ?? ""} /></label>
                </fieldset>
                <fieldset>
                  <legend>Organisation</legend>
                  <label className="client-form-wide">Standort<select name="location_id" defaultValue={client?.location_id ?? ""}><option value="">Kein Standort</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                  {locations.length === 0 ? <p className="client-form-wide">Noch keine Standorte vorhanden. Bitte zuerst einen Standort anlegen.</p> : null}
                  <label className="client-form-wide">Notizen<textarea name="notes" rows={4} defaultValue={client?.notes ?? ""} /></label>
                </fieldset>
                <div className="client-form-actions">
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
