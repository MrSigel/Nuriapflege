"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileWarning,
  FilterX,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Profile = { companyId: string; userId: string };
type AbsenceStatus = "pending" | "approved" | "rejected" | "cancelled";
type AbsenceType = "urlaub" | "krankheit" | "frei" | "fortbildung" | "sonstiges";
type Absence = {
  id: string;
  company_id: string;
  employee_id: string;
  user_id: string | null;
  absence_type: AbsenceType;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  status: AbsenceStatus;
  reason: string | null;
  note: string | null;
  attachment_id: string | null;
  requested_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  cancelled_at: string | null;
};
type TabKey = "all" | "pending" | "approved" | "rejected" | "history";
type RangeFilter = "all" | "upcoming" | "year";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "Alle" },
  { key: "pending", label: "Offen" },
  { key: "approved", label: "Genehmigt" },
  { key: "rejected", label: "Abgelehnt" },
  { key: "history", label: "Verlauf" },
];

const typeLabels: Record<AbsenceType, string> = {
  urlaub: "Urlaub",
  krankheit: "Krankheit",
  frei: "Frei",
  fortbildung: "Fortbildung",
  sonstiges: "Sonstiges",
};

const statusLabels: Record<AbsenceStatus, string> = {
  pending: "Offen",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  cancelled: "Zurückgezogen",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function currentYear() {
  return new Date().getFullYear();
}

function value(input: string | null | undefined) {
  return input && input.trim() ? input : "Nicht hinterlegt";
}

function dateLabel(input: string | null | undefined) {
  if (!input) {
    return "Nicht hinterlegt";
  }

  return new Intl.DateTimeFormat("de-DE").format(new Date(`${input}T00:00:00`));
}

function dateTimeLabel(input: string | null | undefined) {
  if (!input) {
    return "Nicht hinterlegt";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(input));
}

function daysBetween(start: string, end: string) {
  return Math.max(
    1,
    Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1,
  );
}

function defaultForm() {
  const today = todayKey();

  return {
    absence_type: "urlaub" as AbsenceType,
    start_date: today,
    end_date: today,
    is_full_day: true,
    start_time: "",
    end_time: "",
    reason: "",
    note: "",
  };
}

export function StaffAbsencePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Absence[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeFilter>("all");
  const [type, setType] = useState<"all" | AbsenceType>("all");
  const [status, setStatus] = useState<"all" | AbsenceStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Absence | null>(null);
  const [form, setForm] = useState(defaultForm);

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/login");
      return;
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profileRow?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profileRow.role)) {
      setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support.");
      setLoading(false);
      return;
    }

    const { data, error: absenceError } = await supabase
      .from("employee_absences")
      .select(
        "id, company_id, employee_id, user_id, absence_type, start_date, end_date, start_time, end_time, is_full_day, status, reason, note, attachment_id, requested_by, reviewed_by, reviewed_at, review_note, created_at, cancelled_at",
      )
      .eq("company_id", profileRow.company_id)
      .eq("employee_id", user.id)
      .order("start_date", { ascending: false });

    if (absenceError) {
      setError("Abwesenheiten konnten nicht geladen werden.");
      setLoading(false);
      return;
    }

    setProfile({ companyId: profileRow.company_id, userId: user.id });
    setItems((data ?? []) as Absence[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const today = todayKey();
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (tab === "pending" && item.status !== "pending") return false;
        if (tab === "approved" && item.status !== "approved") return false;
        if (tab === "rejected" && item.status !== "rejected") return false;
        if (tab === "history" && !(item.end_date < today || item.status === "cancelled" || item.status === "rejected")) return false;
        if (range === "upcoming" && item.end_date < today) return false;
        if (range === "year" && new Date(`${item.start_date}T00:00:00`).getFullYear() !== currentYear()) return false;

        const haystack = [
          typeLabels[item.absence_type],
          statusLabels[item.status],
          item.reason,
          item.note,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || haystack.includes(query.toLowerCase())) &&
          (type === "all" || item.absence_type === type) &&
          (status === "all" || item.status === status)
        );
      }),
    [items, query, range, status, tab, today, type],
  );

  const nextAbsence = items
    .filter((item) => item.status === "approved" && item.start_date >= today)
    .sort((left, right) => left.start_date.localeCompare(right.start_date))[0];
  const stats = [
    ["Offene Anträge", items.filter((item) => item.status === "pending").length, Clock3],
    [
      "Genehmigte Tage",
      items.filter((item) => item.status === "approved").reduce((sum, item) => sum + daysBetween(item.start_date, item.end_date), 0),
      CheckCircle2,
    ],
    ["Abgelehnte Anträge", items.filter((item) => item.status === "rejected").length, XCircle],
    [
      "Abwesenheiten dieses Jahr",
      items.filter((item) => new Date(`${item.start_date}T00:00:00`).getFullYear() === currentYear()).length,
      CalendarDays,
    ],
    ["Nächste Abwesenheit", nextAbsence ? dateLabel(nextAbsence.start_date) : "0", CalendarDays],
    ["Zurückgezogene Anträge", items.filter((item) => item.status === "cancelled").length, FileWarning],
  ] as const;

  const hasDirtyForm =
    form.absence_type !== "urlaub" ||
    form.start_date !== today ||
    form.end_date !== today ||
    !form.is_full_day ||
    Boolean(form.start_time || form.end_time || form.reason || form.note);

  function close() {
    if (hasDirtyForm && !window.confirm("Änderungen verwerfen?")) {
      return;
    }

    setOpen(false);
    setForm(defaultForm());
  }

  function validate() {
    if (!form.absence_type || !form.start_date || !form.end_date || !form.reason.trim()) {
      return "Bitte füllen Sie alle Pflichtfelder aus.";
    }

    if (form.end_date < form.start_date) {
      return "Enddatum darf nicht vor Startdatum liegen.";
    }

    if (!form.is_full_day && (!form.start_time || !form.end_time)) {
      return "Startzeit und Endzeit sind erforderlich.";
    }

    return null;
  }

  async function createAbsence() {
    if (!profile || saving) return;

    const validationError = validate();
    if (validationError) {
      setNotice(validationError);
      return;
    }

    setSaving(true);
    setNotice(null);
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("employee_absences").insert({
      company_id: profile.companyId,
      employee_id: profile.userId,
      user_id: profile.userId,
      absence_type: form.absence_type,
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.is_full_day ? null : form.start_time,
      end_time: form.is_full_day ? null : form.end_time,
      is_full_day: form.is_full_day,
      reason: form.reason.trim(),
      note: form.note.trim() || null,
      requested_by: profile.userId,
      status: "pending",
      created_by: profile.userId,
      updated_by: profile.userId,
    });

    if (insertError) {
      setNotice("Antrag konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNotice("Antrag wurde eingereicht.");
    setOpen(false);
    setForm(defaultForm());
    setSaving(false);
    await load();
  }

  async function cancelAbsence(item: Absence) {
    if (!profile || item.status !== "pending" || !window.confirm("Möchten Sie diesen Antrag wirklich zurückziehen?")) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error: updateError } = await supabase
      .from("employee_absences")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_by: profile.userId })
      .eq("company_id", profile.companyId)
      .eq("employee_id", profile.userId)
      .eq("id", item.id)
      .eq("status", "pending");

    if (updateError) {
      setNotice("Antrag konnte nicht zurückgezogen werden.");
      return;
    }

    setNotice("Antrag wurde zurückgezogen.");
    await load();
  }

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="page clients-page staff-absence-page"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="clients-header">
        <div>
          <h1>Meine Abwesenheiten / Urlaub</h1>
          <p>Urlaub beantragen und eigene Abwesenheiten einsehen.</p>
        </div>
        <div className="clients-header-actions">
          <motion.button className="button" onClick={() => setOpen(true)} type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            <Plus size={16} />
            Abwesenheit beantragen
          </motion.button>
        </div>
      </div>

      {notice ? (
        <motion.div animate={{ opacity: 1, y: 0 }} className="auth-message success" initial={{ opacity: 0, y: -6 }}>
          {notice}
        </motion.div>
      ) : null}

      <div className="client-stats-grid">
        {stats.map(([label, amount, Icon], index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
            initial={{ opacity: 0, y: 8 }}
            key={label}
            transition={{ delay: index * 0.025 }}
          >
            <div className="stat-icon">
              <Icon size={18} />
            </div>
            <span>{label}</span>
            <strong>{amount}</strong>
          </motion.div>
        ))}
      </div>

      <div className="settings-tabs staff-tabs">
        {tabs.map((item) => (
          <motion.button
            className={`settings-tab ${tab === item.key ? "active" : ""}`}
            key={item.key}
            onClick={() => setTab(item.key)}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      <motion.div animate={{ opacity: 1, y: 0 }} className="client-filter-panel" initial={{ opacity: 0, y: 8 }}>
        <label>
          <Search size={16} />
          Suche
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Typ, Grund, Notiz, Status" value={query} />
        </label>
        <label>
          Zeitraum
          <select onChange={(event) => setRange(event.target.value as RangeFilter)} value={range}>
            <option value="all">Alle</option>
            <option value="upcoming">Kommend</option>
            <option value="year">Dieses Jahr</option>
          </select>
        </label>
        <label>
          Typ
          <select onChange={(event) => setType(event.target.value as "all" | AbsenceType)} value={type}>
            <option value="all">Alle</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select onChange={(event) => setStatus(event.target.value as "all" | AbsenceStatus)} value={status}>
            <option value="all">Alle</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" onClick={() => { setQuery(""); setRange("all"); setType("all"); setStatus("all"); }} type="button">
          <FilterX size={16} />
          Zurücksetzen
        </button>
      </motion.div>

      {error ? (
        <motion.div className="empty-state">
          <strong>{error}</strong>
        </motion.div>
      ) : loading ? (
        <motion.div className="empty-state">
          <strong>Abwesenheiten werden geladen.</strong>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div animate={{ opacity: 1, y: 0 }} className="empty-state" initial={{ opacity: 0, y: 8 }}>
          <strong>Noch keine Abwesenheiten vorhanden.</strong>
          <p>Beantragen Sie Urlaub oder melden Sie eine Abwesenheit.</p>
          <button className="button" onClick={() => setOpen(true)} type="button">
            <Plus size={16} />
            Abwesenheit beantragen
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div animate={{ opacity: 1, y: 0 }} className="clients-list" exit={{ opacity: 0, y: -8 }} initial={{ opacity: 0, y: 8 }} key={tab}>
            {filtered.map((item, index) => (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="client-card"
                initial={{ opacity: 0, y: 8 }}
                key={item.id}
                transition={{ delay: index * 0.02 }}
              >
                <div className="client-card-header">
                  <div>
                    <span>
                      {dateLabel(item.start_date)} - {dateLabel(item.end_date)}
                    </span>
                    <h2>{typeLabels[item.absence_type]}</h2>
                  </div>
                  <span className={`location-status ${item.status}`}>{statusLabels[item.status]}</span>
                </div>
                <div className="client-details-grid">
                  <div>
                    <span>Tage</span>
                    <strong>{daysBetween(item.start_date, item.end_date)}</strong>
                  </div>
                  <div>
                    <span>Grund</span>
                    <strong>{value(item.reason)}</strong>
                  </div>
                  <div>
                    <span>Notiz</span>
                    <strong>{value(item.note)}</strong>
                  </div>
                  <div>
                    <span>Angefragt am</span>
                    <strong>{dateTimeLabel(item.created_at)}</strong>
                  </div>
                  <div>
                    <span>Geprüft von</span>
                    <strong>{value(item.reviewed_by)}</strong>
                  </div>
                  <div>
                    <span>Prüfnachricht</span>
                    <strong>{value(item.review_note)}</strong>
                  </div>
                </div>
                <div className="location-actions">
                  <button className="button secondary" onClick={() => setDetail(item)} type="button">
                    <Eye size={15} />
                    Ansehen
                  </button>
                  {item.attachment_id ? (
                    <button className="button secondary" disabled type="button">
                      Dokumentenupload wird vorbereitet.
                    </button>
                  ) : null}
                  {item.status === "pending" ? (
                    <button className="button secondary danger" onClick={() => cancelAbsence(item)} type="button">
                      Zurückziehen
                    </button>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {detail ? (
          <motion.div animate={{ opacity: 1 }} className="modal-backdrop" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={() => setDetail(null)}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="modal-panel client-modal-panel"
              exit={{ opacity: 0, y: 12 }}
              initial={{ opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>{typeLabels[detail.absence_type]}</h2>
                  <p>
                    {dateLabel(detail.start_date)} - {dateLabel(detail.end_date)}
                  </p>
                </div>
                <button className="icon-button" onClick={() => setDetail(null)} type="button">
                  <X size={18} />
                </button>
              </div>
              <div className="client-details-grid">
                <div>
                  <span>Status</span>
                  <strong>{statusLabels[detail.status]}</strong>
                </div>
                <div>
                  <span>Tage</span>
                  <strong>{daysBetween(detail.start_date, detail.end_date)}</strong>
                </div>
                <div>
                  <span>Zeitraum</span>
                  <strong>{detail.is_full_day ? "Ganztägig" : `${value(detail.start_time)} - ${value(detail.end_time)}`}</strong>
                </div>
                <div>
                  <span>Grund</span>
                  <strong>{value(detail.reason)}</strong>
                </div>
                <div>
                  <span>Notiz</span>
                  <strong>{value(detail.note)}</strong>
                </div>
                <div>
                  <span>Dokument</span>
                  <strong>{detail.attachment_id ? "Dokumentenupload wird vorbereitet." : "Nicht hinterlegt"}</strong>
                </div>
                <div>
                  <span>Angefragt am</span>
                  <strong>{dateTimeLabel(detail.created_at)}</strong>
                </div>
                <div>
                  <span>Geprüft von</span>
                  <strong>{value(detail.reviewed_by)}</strong>
                </div>
                <div>
                  <span>Geprüft am</span>
                  <strong>{dateTimeLabel(detail.reviewed_at)}</strong>
                </div>
                <div>
                  <span>Prüfnachricht</span>
                  <strong>{value(detail.review_note)}</strong>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div animate={{ opacity: 1 }} className="modal-backdrop" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={close}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="modal-panel client-modal-panel"
              exit={{ opacity: 0, y: 12 }}
              initial={{ opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>Abwesenheit beantragen</h2>
                  <p>Eigenen Antrag einreichen.</p>
                </div>
                <button className="icon-button" onClick={close} type="button">
                  <X size={18} />
                </button>
              </div>
              <div className="client-form">
                <label>
                  Typ
                  <select onChange={(event) => setForm((current) => ({ ...current, absence_type: event.target.value as AbsenceType }))} value={form.absence_type}>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Startdatum
                  <input onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} type="date" value={form.start_date} />
                </label>
                <label>
                  Enddatum
                  <input onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} type="date" value={form.end_date} />
                </label>
                <label className="checkbox-row">
                  <input
                    checked={form.is_full_day}
                    onChange={(event) => setForm((current) => ({ ...current, is_full_day: event.target.checked, start_time: "", end_time: "" }))}
                    type="checkbox"
                  />
                  Ganztägig
                </label>
                {!form.is_full_day ? (
                  <>
                    <label>
                      Startzeit
                      <input onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))} type="time" value={form.start_time} />
                    </label>
                    <label>
                      Endzeit
                      <input onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value }))} type="time" value={form.end_time} />
                    </label>
                  </>
                ) : null}
                <label className="client-form-wide">
                  Grund
                  <textarea onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={3} value={form.reason} />
                </label>
                <label className="client-form-wide">
                  Notiz optional
                  <textarea onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={3} value={form.note} />
                </label>
                <div className="empty-state client-form-wide">
                  <strong>Dokumentenupload wird vorbereitet.</strong>
                </div>
                <div className="client-form-actions client-form-wide">
                  <button className="button secondary" onClick={close} type="button">
                    Abbrechen
                  </button>
                  <button className="button" disabled={saving} onClick={createAbsence} type="button">
                    Antrag senden
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
