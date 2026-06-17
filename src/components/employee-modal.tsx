"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Send, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import type { Employee, EmployeeLocationOption, EmployeeStatus, InvitationStatus } from "@/lib/employees";

type ActionResult = { ok: boolean; message?: string };

type EmployeeModalProps = {
  action: (formData: FormData) => Promise<ActionResult>;
  buttonLabel: string;
  mode: "invite" | "create" | "edit";
  locations: EmployeeLocationOption[];
  employee?: Employee;
};

const roleOptions = [
  ["inhaber", "Inhaber"],
  ["pdl", "Pflegedienstleitung"],
  ["verwaltung", "Verwaltung"],
  ["mitarbeiter", "Mitarbeiter"],
  ["pflegefachkraft", "Pflegefachkraft"],
] as const;

const statusOptions: Array<[EmployeeStatus, string]> = [
  ["active", "Aktiv"],
  ["inactive", "Inaktiv"],
  ["invited", "Eingeladen"],
  ["pending", "Ausstehend"],
];

const invitationOptions: Array<[InvitationStatus, string]> = [
  ["not_invited", "Nicht eingeladen"],
  ["invited", "Eingeladen"],
  ["accepted", "Angenommen"],
  ["expired", "Abgelaufen"],
];

export function EmployeeModal({ action, buttonLabel, mode, locations, employee }: EmployeeModalProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (_: ActionResult, formData: FormData) => action(formData), { ok: false });
  const selectedLocations = new Set(employee?.locations.map((location) => location.id) ?? []);
  const title = mode === "invite" ? "Mitarbeiter einladen" : mode === "edit" ? "Mitarbeiter bearbeiten" : "Mitarbeiter hinzufügen";
  const Icon = mode === "invite" ? Send : Plus;

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <motion.button className={mode === "edit" ? "button secondary" : "button"} onClick={() => setOpen(true)} type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        <Icon size={16} />
        {buttonLabel}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div animate={{ opacity: 1 }} className="modal-backdrop" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="modal-panel"
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="modal-header">
                <div>
                  <h2>{title}</h2>
                  <p>{mode === "invite" ? "Einladung strukturell vorbereiten." : "Mitarbeiterdaten für das eigene Unternehmen pflegen."}</p>
                </div>
                <button className="modal-close" onClick={() => setOpen(false)} type="button" aria-label="Fenster schließen">
                  <X size={18} />
                </button>
              </div>

              <form action={formAction} className="location-form">
                {employee ? <input name="id" type="hidden" value={employee.id} /> : null}
                <label>
                  Vorname
                  <input name="first_name" required defaultValue={employee?.first_name ?? ""} />
                </label>
                <label>
                  Nachname
                  <input name="last_name" required defaultValue={employee?.last_name ?? ""} />
                </label>
                <label>
                  E-Mail
                  <input name="email" type="email" required disabled={mode === "edit"} defaultValue={employee?.email ?? ""} />
                </label>
                <label>
                  Telefonnummer
                  <input name="phone" defaultValue={employee?.phone ?? ""} />
                </label>
                <label>
                  Rolle
                  <select name="role" required defaultValue={employee?.role ?? "mitarbeiter"}>
                    {roleOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Kürzel
                  <input name="staff_code" required minLength={2} maxLength={5} defaultValue={employee?.staff_code ?? ""} />
                </label>
                <label>
                  Qualifikation
                  <input name="qualification" defaultValue={employee?.qualification ?? ""} />
                </label>
                {mode !== "invite" ? (
                  <label>
                    Status
                    <select name="status" required defaultValue={employee?.status ?? "active"}>
                      {statusOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {mode === "edit" ? (
                  <label>
                    Einladungsstatus
                    <select name="invitation_status" required defaultValue={employee?.invitation_status ?? "not_invited"}>
                      {invitationOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <fieldset className="location-form-wide employee-location-fieldset">
                  <legend>Standorte</legend>
                  {locations.length > 0 ? (
                    <div className="employee-location-options">
                      {locations.map((location) => (
                        <label key={location.id}>
                          <input name="location_ids" type="checkbox" value={location.id} defaultChecked={selectedLocations.has(location.id)} />
                          {location.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p>Noch keine Standorte vorhanden. Bitte zuerst einen Standort anlegen.</p>
                  )}
                </fieldset>
                {state.message ? <p className={`form-status ${state.ok ? "success" : "error"}`}>{state.message}</p> : null}
                <motion.button className="button location-form-submit" disabled={pending} type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  {pending ? "Speichern..." : buttonLabel}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
