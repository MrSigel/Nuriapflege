"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Eye, FilterX, MapPin, PauseCircle, Search, Stethoscope, UserRound, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmActionDialog } from "@/components/action-dialogs";
import { ClientModal } from "@/components/client-modal";
import type { CareLevel, ClientsData, ClientStatus } from "@/lib/clients";

type ClientsPageProps = {
  data: ClientsData;
  actions: {
    createClient: (formData: FormData) => void;
    updateClient: (formData: FormData) => void;
    changeClientStatus: (formData: FormData) => void;
  };
};

const statusLabels: Record<ClientStatus, string> = { active: "Aktiv", inactive: "Inaktiv", paused: "Pausiert" };
const careLevelLabels: Record<CareLevel, string> = {
  none: "kein Pflegegrad",
  "1": "Pflegegrad 1",
  "2": "Pflegegrad 2",
  "3": "Pflegegrad 3",
  "4": "Pflegegrad 4",
  "5": "Pflegegrad 5",
  applied: "beantragt",
  unknown: "unbekannt",
};

function value(text: string | null | undefined) {
  return text && text.trim().length > 0 ? text : "Nicht hinterlegt";
}

export function ClientsPage({ data, actions }: ClientsPageProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [careLevel, setCareLevel] = useState("all");
  const [locationId, setLocationId] = useState("all");

  const filteredClients = useMemo(() => {
    const search = query.trim().toLowerCase();
    return data.clients.filter((client) => {
      const haystack = [client.first_name, client.last_name, client.client_number, client.city, client.phone].filter(Boolean).join(" ").toLowerCase();
      return (
        (!search || haystack.includes(search)) &&
        (status === "all" || client.status === status) &&
        (careLevel === "all" || client.care_level === careLevel) &&
        (locationId === "all" || (locationId === "none" ? !client.location_id : client.location_id === locationId))
      );
    });
  }, [careLevel, data.clients, locationId, query, status]);

  const stats = [
    ["Klienten gesamt", data.stats.total, Users],
    ["Aktive Klienten", data.stats.active, UserRound],
    ["Pausierte Klienten", data.stats.paused, PauseCircle],
    ["Inaktive Klienten", data.stats.inactive, UserRound],
    ["Ohne Standort", data.stats.withoutLocation, MapPin],
    ["Ohne Pflegegrad", data.stats.withoutCareLevel, Stethoscope],
  ] as const;

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setCareLevel("all");
    setLocationId("all");
  }

  return (
    <motion.section className="page clients-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="clients-header">
        <div>
          <h1>Klienten</h1>
          <p>Verwalten Sie Klienten, Stammdaten, Ansprechpartner und Pflegegrunddaten Ihres Pflegedienstes.</p>
        </div>
        <div className="clients-header-actions">
          <ClientModal action={actions.createClient} buttonLabel="Klient anlegen" submitLabel="Klient anlegen" locations={data.locations} />
          <button className="button secondary" disabled title="Export wird vorbereitet." type="button"><Download size={16} />Klienten exportieren</button>
        </div>
      </div>

      <div className="client-stats-grid">
        {stats.map(([label, count, Icon], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02, duration: 0.18 }}>
            <div className="stat-icon"><Icon size={18} /></div>
            <span>{label}</span>
            <strong>{count}</strong>
          </motion.div>
        ))}
      </div>

      <motion.div className="client-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, Nummer, Ort, Telefon" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="inactive">Inaktiv</option></select></label>
        <label>Pflegegrad<select value={careLevel} onChange={(event) => setCareLevel(event.target.value)}><option value="all">Alle</option>{Object.entries(careLevelLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Standort<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Standort</option>{data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <button className="button secondary" type="button" onClick={resetFilters}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>

      <AnimatePresence mode="wait">
        {data.clients.length === 0 ? null : (
          <motion.div className="clients-list" key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filteredClients.map((client) => (
              <motion.article className="client-card" key={client.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="client-card-header">
                  <div>
                    <span>{client.client_number || "Keine Klientennummer"}</span>
                    <h2>{client.first_name} {client.last_name}</h2>
                  </div>
                  <div className="client-badges">
                    <span className={`client-care-badge care-${client.care_level}`}>{careLevelLabels[client.care_level]}</span>
                    <span className={`location-status ${client.status}`}>{statusLabels[client.status]}</span>
                  </div>
                </div>
                <div className="client-details-grid">
                  <div><span>Standort</span><strong>{value(client.location_name)}</strong></div>
                  <div><span>Ort</span><strong>{value(client.city)}</strong></div>
                  <div><span>Telefonnummer</span><strong>{value(client.phone)}</strong></div>
                  <div><span>Hauptansprechpartner</span><strong>{value(client.primary_contact_name)}</strong></div>
                  <div><span>Zuletzt aktualisiert</span><strong>{new Intl.DateTimeFormat("de-DE").format(new Date(client.updated_at))}</strong></div>
                </div>
                <div className="location-actions">
                  <details>
                    <summary><Eye size={15} />Ansehen</summary>
                    <div className="location-detail-panel client-detail-panel">
                      <p>Stammdaten: {client.first_name} {client.last_name}, {value(client.gender)}, geboren am {value(client.date_of_birth)}</p>
                      <p>Adresse: {[client.street, client.house_number, client.postal_code, client.city].filter(Boolean).join(" ") || "Nicht hinterlegt"}</p>
                      <p>Kontakt: {value(client.phone)} · {value(client.email)}</p>
                      <p>Pflegegrunddaten: {careLevelLabels[client.care_level]}, {value(client.insurance_provider)}, {value(client.insurance_number)}</p>
                      <p>Ansprechpartner: {value(client.primary_contact_name)}, {value(client.primary_contact_relation)}, {value(client.primary_contact_phone)}, {value(client.primary_contact_email)}</p>
                      <p>Standort: {value(client.location_name)}</p>
                      <p>Status: {statusLabels[client.status]}</p>
                      <p>Notizen: {value(client.notes)}</p>
                    </div>
                  </details>
                  <ClientModal action={actions.updateClient} buttonLabel="Bearbeiten" submitLabel="Änderungen speichern" locations={data.locations} client={client} />
                  {(["active", "paused", "inactive"] as ClientStatus[]).filter((next) => next !== client.status).map((next) => (
                    <ConfirmActionDialog
                      action={actions.changeClientStatus}
                      buttonLabel={`${statusLabels[next]} setzen`}
                      description="Bitte bestätigen Sie die Statusänderung für diesen Klienten."
                      hiddenFields={[{ name: "id", value: client.id }, { name: "status", value: next }]}
                      key={next}
                      title="Status ändern"
                    />
                  ))}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
