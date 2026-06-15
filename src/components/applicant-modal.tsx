"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import type { ApplicantLocation, ApplicantRecord } from "@/lib/applicants";

type ApplicantModalProps = {
  action: (formData: FormData) => void;
  buttonLabel: string;
  submitLabel: string;
  locations: ApplicantLocation[];
  applicant?: ApplicantRecord;
};

const statusOptions = [
  ["new", "Neu"],
  ["contacted", "Kontaktiert"],
  ["interview_planned", "Gespräch geplant"],
  ["interview_done", "Gespräch geführt"],
  ["offer_sent", "Angebot gesendet"],
  ["hired", "Eingestellt"],
  ["rejected", "Abgelehnt"],
  ["archived", "Archiviert"],
] as const;

const ratingOptions = [
  ["none", "Keine Bewertung"],
  ["interesting", "Interessant"],
  ["strong", "Stark"],
  ["not_suitable", "Nicht passend"],
] as const;

const sourceOptions = [
  ["manual", "Manuell"],
  ["website", "Website"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["recommendation", "Empfehlung"],
  ["job_portal", "Jobportal"],
  ["phone", "Telefon"],
  ["email", "E-Mail"],
  ["other", "Sonstiges"],
] as const;

const positionOptions = [
  ["pflegefachkraft", "Pflegefachkraft"],
  ["pflegehelfer", "Pflegehelfer"],
  ["hauswirtschaft", "Hauswirtschaft"],
  ["betreuungskraft", "Betreuungskraft"],
  ["verwaltung", "Verwaltung"],
  ["pdl", "Pflegedienstleitung"],
  ["azubi", "Auszubildende/r"],
  ["quereinsteiger", "Quereinsteiger"],
  ["sonstiges", "Sonstiges"],
] as const;

function inputDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function ApplicantModal({ action, buttonLabel, submitLabel, locations, applicant }: ApplicantModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        {applicant ? <Pencil size={16} /> : <Plus size={16} />}
        {buttonLabel}
      </motion.button>
      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-panel applicant-modal-panel" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
              <div className="modal-header">
                <div>
                  <h2>{buttonLabel}</h2>
                  <p>Bewerberdaten, Kontakt, Status und Wiedervorlage verwalten.</p>
                </div>
                <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Schließen">
                  <X size={18} />
                </button>
              </div>
              <form action={action} className="applicant-form">
                {applicant ? <input name="id" type="hidden" value={applicant.id} /> : null}
                <fieldset>
                  <legend>Person</legend>
                  <label>Vorname<input name="first_name" required defaultValue={applicant?.first_name ?? ""} /></label>
                  <label>Nachname<input name="last_name" required defaultValue={applicant?.last_name ?? ""} /></label>
                  <label>E-Mail<input name="email" type="email" defaultValue={applicant?.email ?? ""} /></label>
                  <label>Telefon<input name="phone" defaultValue={applicant?.phone ?? ""} /></label>
                </fieldset>
                <fieldset>
                  <legend>Bewerbung</legend>
                  <label>Gewünschte Position<select name="desired_position" required defaultValue={applicant?.desired_position ?? "pflegefachkraft"}>{positionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Qualifikation<input name="qualification" defaultValue={applicant?.qualification ?? ""} /></label>
                  <label>Verfügbarkeit<input name="availability" defaultValue={applicant?.availability ?? ""} /></label>
                  <label>Quelle<select name="source" defaultValue={applicant?.source ?? "manual"}>{sourceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Status<select name="status" required defaultValue={applicant?.status ?? "new"}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Bewertung<select name="rating" defaultValue={applicant?.rating ?? "none"}>{ratingOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="applicant-form-wide">Standort<select name="location_id" defaultValue={applicant?.location_id ?? ""}><option value="">Kein Standort</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                  {locations.length === 0 ? <p className="applicant-form-wide">Noch keine Standorte vorhanden. Bewerber kann ohne Standort angelegt werden.</p> : null}
                </fieldset>
                <fieldset>
                  <legend>Kontakt & Wiedervorlage</legend>
                  <label>Letzte Kontaktaufnahme<input name="last_contact_at" type="datetime-local" defaultValue={inputDateTime(applicant?.last_contact_at)} /></label>
                  <label>Nächste Wiedervorlage<input name="next_follow_up_at" type="datetime-local" defaultValue={inputDateTime(applicant?.next_follow_up_at)} /></label>
                </fieldset>
                <fieldset>
                  <legend>Notizen</legend>
                  <label className="applicant-form-wide">Notizen<textarea name="notes" rows={5} defaultValue={applicant?.notes ?? ""} /></label>
                </fieldset>
                <div className="applicant-form-actions">
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
