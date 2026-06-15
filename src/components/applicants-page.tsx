"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, CalendarClock, Download, Eye, FilterX, Mail, Phone, Search, Star, UserCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ApplicantModal } from "@/components/applicant-modal";
import type { ApplicantPosition, ApplicantRating, ApplicantsData, ApplicantSource, ApplicantStatus } from "@/lib/applicants";

type ApplicantsPageProps = {
  data: ApplicantsData;
  actions: {
    createApplicant: (formData: FormData) => void;
    updateApplicant: (formData: FormData) => void;
    changeApplicantStatus: (formData: FormData) => void;
    changeApplicantRating: (formData: FormData) => void;
    setApplicantFollowUp: (formData: FormData) => void;
  };
};

const statusLabels: Record<ApplicantStatus, string> = { new: "Neu", contacted: "Kontaktiert", interview_planned: "Gespräch geplant", interview_done: "Gespräch geführt", offer_sent: "Angebot gesendet", hired: "Eingestellt", rejected: "Abgelehnt", archived: "Archiviert" };
const ratingLabels: Record<ApplicantRating, string> = { none: "Keine Bewertung", interesting: "Interessant", strong: "Stark", not_suitable: "Nicht passend" };
const sourceLabels: Record<ApplicantSource, string> = { manual: "Manuell", website: "Website", facebook: "Facebook", instagram: "Instagram", recommendation: "Empfehlung", job_portal: "Jobportal", phone: "Telefon", email: "E-Mail", other: "Sonstiges" };
const positionLabels: Record<ApplicantPosition, string> = { pflegefachkraft: "Pflegefachkraft", pflegehelfer: "Pflegehelfer", hauswirtschaft: "Hauswirtschaft", betreuungskraft: "Betreuungskraft", verwaltung: "Verwaltung", pdl: "Pflegedienstleitung", azubi: "Auszubildende/r", quereinsteiger: "Quereinsteiger", sonstiges: "Sonstiges" };

const tabs = [
  ["all", "Alle"],
  ["new", "Neu"],
  ["contact", "In Kontakt"],
  ["interviews", "Gespräche"],
  ["offers", "Angebote"],
  ["hired", "Eingestellt"],
  ["archive", "Archiv"],
] as const;

function value(text: string | null | undefined) {
  return text && text.trim().length > 0 ? text : "Nicht hinterlegt";
}

function dateValue(text: string | null | undefined) {
  if (!text) return "Nicht hinterlegt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(text));
}

function inputDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function inTab(status: ApplicantStatus, tab: string) {
  if (tab === "all") return status !== "archived";
  if (tab === "new") return status === "new";
  if (tab === "contact") return status === "contacted";
  if (tab === "interviews") return status === "interview_planned" || status === "interview_done";
  if (tab === "offers") return status === "offer_sent";
  if (tab === "hired") return status === "hired";
  if (tab === "archive") return status === "archived";
  return true;
}

export function ApplicantsPage({ data, actions }: ApplicantsPageProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("all");
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  const [position, setPosition] = useState("all");
  const [source, setSource] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [availability, setAvailability] = useState("");
  const [period, setPeriod] = useState("all");
  const [followUp, setFollowUp] = useState("all");

  const filteredApplicants = useMemo(() => {
    const search = query.trim().toLowerCase();
    const now = Date.now();
    return data.applicants.filter((applicant) => {
      const createdAt = new Date(applicant.created_at).getTime();
      const haystack = [applicant.first_name, applicant.last_name, applicant.email, applicant.phone, positionLabels[applicant.desired_position], applicant.qualification, applicant.notes].filter(Boolean).join(" ").toLowerCase();
      const hasOpenFollowUp = !!applicant.next_follow_up_at && new Date(applicant.next_follow_up_at).getTime() <= now && applicant.status !== "archived";
      return (
        inTab(applicant.status, activeTab) &&
        (!search || haystack.includes(search)) &&
        (status === "all" || applicant.status === status) &&
        (rating === "all" || applicant.rating === rating) &&
        (position === "all" || applicant.desired_position === position) &&
        (source === "all" || applicant.source === source) &&
        (locationId === "all" || (locationId === "none" ? !applicant.location_id : applicant.location_id === locationId)) &&
        (!availability || (applicant.availability ?? "").toLowerCase().includes(availability.toLowerCase())) &&
        (followUp === "all" || hasOpenFollowUp) &&
        (period === "all" || (period === "30" ? createdAt >= now - 30 * 24 * 60 * 60 * 1000 : createdAt >= now - 90 * 24 * 60 * 60 * 1000))
      );
    });
  }, [activeTab, availability, data.applicants, followUp, locationId, period, position, query, rating, source, status]);

  const stats = [
    ["Bewerber gesamt", data.stats.total, Users],
    ["Neue Bewerber", data.stats.new, UserPlus],
    ["Gespräche geplant", data.stats.interviews, CalendarClock],
    ["Angebote gesendet", data.stats.offers, Mail],
    ["Eingestellt", data.stats.hired, UserCheck],
    ["Abgelehnt", data.stats.rejected, Archive],
    ["Wiedervorlagen offen", data.stats.openFollowUps, CalendarClock],
    ["Archiviert", data.stats.archived, Archive],
  ] as const;

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setRating("all");
    setPosition("all");
    setSource("all");
    setLocationId("all");
    setAvailability("");
    setPeriod("all");
    setFollowUp("all");
  }

  return (
    <motion.section className="page applicants-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="applicants-header">
        <div>
          <h1>Bewerber / Personalgewinnung</h1>
          <p>Verwalten Sie Bewerbungen, Interessenten und Kontakte für Ihr Pflegeteam.</p>
        </div>
        <div className="applicants-header-actions">
          <ApplicantModal action={actions.createApplicant} buttonLabel="Bewerber anlegen" submitLabel="Bewerber anlegen" locations={data.locations} />
          <button className="button secondary" disabled title="Export wird vorbereitet." type="button"><Download size={16} />Bewerber exportieren</button>
        </div>
      </div>

      <div className="applicant-stats-grid">
        {stats.map(([label, count, Icon], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02, duration: 0.18 }}>
            <div className="stat-icon"><Icon size={18} /></div>
            <span>{label}</span>
            <strong>{count}</strong>
          </motion.div>
        ))}
      </div>

      <motion.div className="applicant-tabs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {tabs.map(([key, label]) => <button className={activeTab === key ? "active" : ""} key={key} type="button" onClick={() => setActiveTab(key)}>{label}</button>)}
      </motion.div>

      <motion.div className="applicant-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, E-Mail, Telefon, Position, Notiz" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Bewertung<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="all">Alle</option>{Object.entries(ratingLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Position<select value={position} onChange={(event) => setPosition(event.target.value)}><option value="all">Alle</option>{Object.entries(positionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Quelle<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Alle</option>{Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Standort<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Standort</option>{data.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label>Verfügbarkeit<input value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="z. B. sofort" /></label>
        <label>Zeitraum<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Alle</option><option value="30">Letzte 30 Tage</option><option value="90">Letzte 90 Tage</option></select></label>
        <label>Wiedervorlage<select value={followUp} onChange={(event) => setFollowUp(event.target.value)}><option value="all">Alle</option><option value="open">Offen</option></select></label>
        <button className="button secondary" type="button" onClick={resetFilters}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>

      <AnimatePresence mode="wait">
        {data.applicants.length === 0 ? null : (
          <motion.div className="applicants-list" key={`${activeTab}-list`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {filteredApplicants.map((applicant) => (
              <motion.article className="applicant-card" key={applicant.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
                <div className="applicant-card-header">
                  <div>
                    <span>{positionLabels[applicant.desired_position]}</span>
                    <h2>{applicant.first_name} {applicant.last_name}</h2>
                  </div>
                  <div className="applicant-badges">
                    <span className={`applicant-status ${applicant.status}`}>{statusLabels[applicant.status]}</span>
                    <span className={`applicant-rating ${applicant.rating}`}><Star size={13} />{ratingLabels[applicant.rating]}</span>
                  </div>
                </div>
                <div className="applicant-details-grid">
                  <div><span>Qualifikation</span><strong>{value(applicant.qualification)}</strong></div>
                  <div><span>Telefon</span><strong>{value(applicant.phone)}</strong></div>
                  <div><span>E-Mail</span><strong>{value(applicant.email)}</strong></div>
                  <div><span>Quelle</span><strong>{sourceLabels[applicant.source]}</strong></div>
                  <div><span>Standort</span><strong>{value(applicant.location_name)}</strong></div>
                  <div><span>Letzter Kontakt</span><strong>{dateValue(applicant.last_contact_at)}</strong></div>
                  <div><span>Nächste Wiedervorlage</span><strong>{dateValue(applicant.next_follow_up_at)}</strong></div>
                </div>
                <div className="applicant-actions">
                  <details>
                    <summary><Eye size={15} />Ansehen</summary>
                    <div className="location-detail-panel applicant-detail-panel">
                      <p>Name: {applicant.first_name} {applicant.last_name}</p>
                      <p>Position: {positionLabels[applicant.desired_position]}</p>
                      <p>Qualifikation: {value(applicant.qualification)}</p>
                      <p>Verfügbarkeit: {value(applicant.availability)}</p>
                      <p>Quelle: {sourceLabels[applicant.source]}</p>
                      <p>Standort: {value(applicant.location_name)}</p>
                      <p>Status: {statusLabels[applicant.status]}</p>
                      <p>Bewertung: {ratingLabels[applicant.rating]}</p>
                      <p>E-Mail: {value(applicant.email)}</p>
                      <p>Telefon: {value(applicant.phone)}</p>
                      <p>Letzte Kontaktaufnahme: {dateValue(applicant.last_contact_at)}</p>
                      <p>Nächste Wiedervorlage: {dateValue(applicant.next_follow_up_at)}</p>
                      <p>Notizen: {value(applicant.notes)}</p>
                      <p>Erstellt von: {value(applicant.created_by_name)}</p>
                      <p>Zuletzt aktualisiert: {dateValue(applicant.updated_at)}</p>
                    </div>
                  </details>
                  <ApplicantModal action={actions.updateApplicant} buttonLabel="Bearbeiten" submitLabel="Änderungen speichern" locations={data.locations} applicant={applicant} />
                  <details>
                    <summary>Status ändern</summary>
                    <div className="applicant-action-menu">
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <form action={actions.changeApplicantStatus} key={key}>
                          <input name="id" type="hidden" value={applicant.id} />
                          <input name="status" type="hidden" value={key} />
                          <button className="button secondary" type="submit" disabled={key === applicant.status}>{label}</button>
                        </form>
                      ))}
                    </div>
                  </details>
                  <details>
                    <summary>Bewertung ändern</summary>
                    <div className="applicant-action-menu">
                      {Object.entries(ratingLabels).map(([key, label]) => (
                        <form action={actions.changeApplicantRating} key={key}>
                          <input name="id" type="hidden" value={applicant.id} />
                          <input name="rating" type="hidden" value={key} />
                          <button className="button secondary" type="submit" disabled={key === applicant.rating}>{label}</button>
                        </form>
                      ))}
                    </div>
                  </details>
                  <form action={actions.setApplicantFollowUp} className="applicant-followup-form">
                    <input name="id" type="hidden" value={applicant.id} />
                    <input name="next_follow_up_at" type="datetime-local" defaultValue={inputDateTime(applicant.next_follow_up_at)} />
                    <button className="button secondary" type="submit"><CalendarClock size={15} />Wiedervorlage setzen</button>
                  </form>
                  {applicant.status !== "archived" ? (
                    <form action={actions.changeApplicantStatus}>
                      <input name="id" type="hidden" value={applicant.id} />
                      <input name="status" type="hidden" value="archived" />
                      <button className="button secondary" type="submit"><Archive size={15} />Archivieren</button>
                    </form>
                  ) : null}
                </div>
              </motion.article>
            ))}
            {filteredApplicants.length === 0 ? <div className="empty-state"><strong>Keine Bewerber gefunden.</strong></div> : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
