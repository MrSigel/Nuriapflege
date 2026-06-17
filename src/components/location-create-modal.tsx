"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

type ActionResult = { ok: boolean; message?: string };

type LocationCreateModalProps = {
  action: (formData: FormData) => Promise<ActionResult>;
  buttonLabel: string;
  submitLabel: string;
};

export function LocationCreateModal({ action, buttonLabel, submitLabel }: LocationCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (_: ActionResult, formData: FormData) => action(formData), { ok: false });

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <motion.button
        className="button"
        onClick={() => setOpen(true)}
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={16} />
        {buttonLabel}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="modal-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="modal-panel"
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="modal-header">
                <div>
                  <h2>Standort hinzufügen</h2>
                  <p>Neuen Standort für den eigenen Pflegedienst anlegen.</p>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)} type="button" aria-label="Fenster schließen">
                  <X size={18} />
                </button>
              </div>

              <form action={formAction} className="location-form">
                <label>
                  Standortname
                  <input name="name" required />
                </label>
                <label>
                  Standorttyp
                  <select name="location_type" required defaultValue="nebenstandort">
                    <option value="nebenstandort">Nebenstandort</option>
                    <option value="verwaltungsstandort">Verwaltungsstandort</option>
                    <option value="aussenstelle">Außenstelle</option>
                    <option value="einsatzgebiet">Einsatzgebiet</option>
                  </select>
                </label>
                <label>
                  Straße
                  <input name="street" />
                </label>
                <label>
                  Hausnummer
                  <input name="house_number" />
                </label>
                <label>
                  PLZ
                  <input name="postal_code" required />
                </label>
                <label>
                  Ort
                  <input name="city" required />
                </label>
                <label>
                  Bundesland
                  <input name="state" />
                </label>
                <label>
                  Telefonnummer
                  <input name="phone" />
                </label>
                <label>
                  E-Mail
                  <input name="email" type="email" />
                </label>
                <label>
                  Ansprechpartner vor Ort
                  <input name="contact_person" />
                </label>
                <label>
                  Status
                  <select name="status" required defaultValue="active">
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </label>
                <label className="location-form-wide">
                  Notizen
                  <textarea name="notes" rows={3} />
                </label>
                {state.message ? <p className={`form-status ${state.ok ? "success" : "error"}`}>{state.message}</p> : null}
                <motion.button className="button location-form-submit" disabled={pending} type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  {pending ? "Speichern..." : submitLabel}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
