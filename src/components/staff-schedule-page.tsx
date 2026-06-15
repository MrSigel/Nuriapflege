"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FilterX,
  MapPin,
  Route,
  Search,
  Timer,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ShiftStatus, ShiftType } from "@/lib/shifts";

type ViewMode = "day" | "week" | "month";

type OwnShift = {
  id: string;
  company_id: string;
  location_id: string | null;
  employee_id: string | null;
  client_id: string | null;
  title: string;
  date: string;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  status: ShiftStatus;
  shift_type: ShiftType;
  notes: string | null;
  updated_at: string;
  client_name: string | null;
  location_name: string | null;
  tour_id: string | null;
  seen_at: string | null;
};

type Option = { id: string; name: string };

const statusLabels: Record<ShiftStatus, string> = {
  planned: "Geplant",
  in_progress: "Läuft",
  completed: "Erledigt",
  cancelled: "Abgesagt",
};

const typeLabels: Record<ShiftType, string> = {
  pflegeeinsatz: "Pflegeeinsatz",
  hauswirtschaft: "Hauswirtschaft",
  beratung: "Beratung",
  verwaltung: "Verwaltung",
  bereitschaft: "Bereitschaft",
  sonstiges: "Sonstiges",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function value(input: string | null | undefined) {
  return input && input.trim().length > 0 ? input : "Nicht hinterlegt";
}

function timeRange(shift: OwnShift) {
  return `${value(shift.suggested_start_time)} - ${value(shift.suggested_end_time)}`;
}

function weekRange(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateKey(start), end: toDateKey(end) };
}

function rangeFor(view: ViewMode, dateKey: string) {
  if (view === "day") return { start: dateKey, end: dateKey };
  if (view === "week") return weekRange(dateKey);
  const date = new Date(`${dateKey}T00:00:00`);
  return {
    start: toDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(`${dateKey}T00:00:00`),
  );
}

function formatDateTime(valueText: string | null) {
  if (!valueText) return "Nicht hinterlegt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valueText));
}

export function StaffSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shifts, setShifts] = useState<OwnShift[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [view, setView] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [shiftType, setShiftType] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [selectedShift, setSelectedShift] = useState<OwnShift | null>(null);
  const [profileContext, setProfileContext] = useState<{ companyId: string; userId: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOwnSchedule() {
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

      if (!active) return;

      if (!user) {
        window.location.assign("/login");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("id, company_id, role").eq("id", user.id).maybeSingle();

      if (!active) return;

      if (!profile?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profile.role)) {
        setError("Ihr Benutzerprofil konnte nicht geladen werden. Bitte melden Sie sich erneut an oder kontaktieren Sie den Support.");
        setLoading(false);
        return;
      }

      setProfileContext({ companyId: profile.company_id, userId: user.id });

      const { data: assignments } = await supabase
        .from("shift_assignments")
        .select("shift_id")
        .eq("company_id", profile.company_id)
        .eq("employee_id", user.id);
      const assignmentShiftIds = Array.from(new Set((assignments ?? []).map((item) => item.shift_id).filter(Boolean)));

      let shiftQuery = supabase
        .from("shifts")
        .select("id, company_id, location_id, employee_id, client_id, title, date, suggested_start_time, suggested_end_time, status, shift_type, notes, updated_at")
        .eq("company_id", profile.company_id)
        .order("date", { ascending: true })
        .order("suggested_start_time", { ascending: true });

      if (assignmentShiftIds.length > 0) {
        shiftQuery = shiftQuery.or(`employee_id.eq.${user.id},id.in.(${assignmentShiftIds.join(",")})`);
      } else {
        shiftQuery = shiftQuery.eq("employee_id", user.id);
      }

      const { data: ownShifts, error: shiftError } = await shiftQuery;

      if (!active) return;

      if (shiftError) {
        setError("Ihr Dienstplan konnte nicht geladen werden.");
        setLoading(false);
        return;
      }

      const rows = ownShifts ?? [];
      const clientIds = Array.from(new Set(rows.map((shift) => shift.client_id).filter(Boolean))) as string[];
      const locationIds = Array.from(new Set(rows.map((shift) => shift.location_id).filter(Boolean))) as string[];
      const shiftDates = Array.from(new Set(rows.map((shift) => shift.date)));

      const shiftIds = rows.map((shift) => shift.id);
      const [{ data: clients }, { data: ownLocations }, { data: ownTours }, { data: confirmations }] = await Promise.all([
        clientIds.length
          ? supabase
              .from("clients")
              .select("id, first_name, last_name")
              .eq("company_id", profile.company_id)
              .in("id", clientIds)
          : Promise.resolve({ data: [] }),
        locationIds.length
          ? supabase.from("company_locations").select("id, name").eq("company_id", profile.company_id).in("id", locationIds)
          : Promise.resolve({ data: [] }),
        shiftDates.length
          ? supabase
              .from("tours")
              .select("id, tour_date")
              .eq("company_id", profile.company_id)
              .eq("employee_id", user.id)
              .in("tour_date", shiftDates)
          : Promise.resolve({ data: [] }),
        shiftIds.length
          ? supabase
              .from("shift_read_confirmations")
              .select("shift_id, seen_at")
              .eq("company_id", profile.company_id)
              .eq("employee_id", user.id)
              .in("shift_id", shiftIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (!active) return;

      const clientMap = new Map((clients ?? []).map((client) => [client.id, [client.first_name, client.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt"]));
      const locationMap = new Map((ownLocations ?? []).map((location) => [location.id, location.name]));
      const tourByDate = new Map((ownTours ?? []).map((tour) => [tour.tour_date, tour.id]));
      const seenMap = new Map((confirmations ?? []).map((confirmation) => [confirmation.shift_id, confirmation.seen_at]));

      const normalized = rows.map((shift) => ({
        ...shift,
        status: shift.status as ShiftStatus,
        shift_type: shift.shift_type as ShiftType,
        client_name: shift.client_id ? clientMap.get(shift.client_id) ?? null : null,
        location_name: shift.location_id ? locationMap.get(shift.location_id) ?? null : null,
        tour_id: tourByDate.get(shift.date) ?? null,
        seen_at: seenMap.get(shift.id) ?? null,
      }));

      setShifts(normalized);
      setLocations((ownLocations ?? []).map((location) => ({ id: location.id, name: location.name })));
      setLoading(false);
    }

    loadOwnSchedule();

    return () => {
      active = false;
    };
  }, []);

  const selectedRange = rangeFor(view, selectedDate);
  const filteredShifts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return shifts.filter((shift) => {
      const haystack = [shift.title, shift.client_name, shift.location_name, shift.notes].filter(Boolean).join(" ").toLowerCase();
      return (
        shift.date >= selectedRange.start &&
        shift.date <= selectedRange.end &&
        (!search || haystack.includes(search)) &&
        (status === "all" || shift.status === status) &&
        (shiftType === "all" || shift.shift_type === shiftType) &&
        (locationId === "all" || (locationId === "none" ? !shift.location_id : shift.location_id === locationId))
      );
    });
  }, [locationId, query, selectedRange.end, selectedRange.start, shiftType, shifts, status]);

  const stats = useMemo(() => {
    const today = todayKey();
    const week = weekRange(today);
    const nextShift = shifts.find((shift) => shift.date >= today && shift.status !== "cancelled");
    return [
      ["Dienste heute", shifts.filter((shift) => shift.date === today).length, CalendarDays],
      ["Dienste diese Woche", shifts.filter((shift) => shift.date >= week.start && shift.date <= week.end).length, CalendarDays],
      ["Nächster Dienst", nextShift ? `${formatDate(nextShift.date)} ${nextShift.suggested_start_time ?? ""}`.trim() : "0", Clock3],
      ["Offene Dienste", shifts.filter((shift) => shift.status === "planned" || shift.status === "in_progress").length, Timer],
      ["Erledigte Dienste", shifts.filter((shift) => shift.status === "completed").length, CheckCircle2],
      ["Eigene Touren heute", shifts.filter((shift) => shift.date === today && shift.tour_id).length, Route],
    ] as const;
  }, [shifts]);

  function move(delta: number) {
    const date = new Date(`${selectedDate}T00:00:00`);
    if (view === "day") date.setDate(date.getDate() + delta);
    if (view === "week") date.setDate(date.getDate() + delta * 7);
    if (view === "month") date.setMonth(date.getMonth() + delta);
    setSelectedDate(toDateKey(date));
  }

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setShiftType("all");
    setLocationId("all");
  }

  async function markSeen(shift: OwnShift) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profileContext) return;
    const seenAt = new Date().toISOString();
    const { error } = await supabase.from("shift_read_confirmations").upsert(
      {
        company_id: profileContext.companyId,
        shift_id: shift.id,
        employee_id: profileContext.userId,
        seen_at: seenAt,
      },
      { onConflict: "company_id,shift_id,employee_id" },
    );

    if (error) {
      setNotice("Gesehen-Status konnte nicht gespeichert werden.");
      return;
    }

    setShifts((current) => current.map((item) => (item.id === shift.id ? { ...item, seen_at: seenAt } : item)));
    setSelectedShift((current) => (current?.id === shift.id ? { ...current, seen_at: seenAt } : current));
    setNotice("Dienst wurde als gesehen markiert.");
  }

  const selectedDayTour = shifts.find((shift) => shift.date === selectedDate && shift.tour_id)?.tour_id;

  return (
    <motion.section className="page staff-schedule-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="shifts-header">
        <div>
          <h1>Mein Dienstplan</h1>
          <p>Ihre geplanten Dienste und Einsätze.</p>
        </div>
        <div className="shifts-header-actions">
          {selectedDayTour ? (
            <Link className="button secondary" href="/mitarbeiter/tour">
              <Route size={16} />
              Meine Tour öffnen
            </Link>
          ) : null}
          <Link className="button secondary" href="/mitarbeiter/zeiterfassung">
            <Timer size={16} />
            Zeit erfassen
          </Link>
        </div>
      </div>

      <div className="shift-stats-grid">
        {stats.map(([label, count, Icon], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
            <div className="stat-icon"><Icon size={18} /></div>
            <span>{label}</span>
            <strong>{count}</strong>
          </motion.div>
        ))}
      </div>

      <motion.div className="shift-viewbar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="segmented">
          {(["day", "week", "month"] as const).map((item) => (
            <button className={view === item ? "active" : ""} key={item} type="button" onClick={() => setView(item)}>
              {item === "day" ? "Tag" : item === "week" ? "Woche" : "Monat"}
            </button>
          ))}
        </div>
        <button className="button secondary icon-only" type="button" onClick={() => move(-1)} aria-label="Zurück"><ChevronLeft size={17} /></button>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        <button className="button secondary" type="button" onClick={() => setSelectedDate(todayKey())}>Heute</button>
        <button className="button secondary icon-only" type="button" onClick={() => move(1)} aria-label="Weiter"><ChevronRight size={17} /></button>
      </motion.div>

      <motion.div className="shift-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Klient, Ort, Notiz" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Diensttyp<select value={shiftType} onChange={(event) => setShiftType(event.target.value)}><option value="all">Alle</option>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Standort<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">Alle</option><option value="none">Ohne Standort</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <button className="button secondary" type="button" onClick={resetFilters}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>

      {error ? (
        <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><h2>Mein Dienstplan</h2><p>{error}</p></motion.div>
      ) : loading ? (
        <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><h2>Dienstplan wird geladen</h2></motion.div>
      ) : shifts.length === 0 ? (
        <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><h2>Noch keine Dienste geplant.</h2><p>Sobald Ihnen Dienste zugewiesen werden, erscheinen sie hier.</p></motion.div>
      ) : (
        <>
          {notice ? (
            <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {notice}
            </motion.div>
          ) : null}
          <AnimatePresence mode="wait">
            {filteredShifts.length === 0 ? (
              <motion.div className="empty-state" key="empty-filtered" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2>Keine Dienste gefunden.</h2>
                <p>Für die aktuelle Auswahl liegen keine eigenen Dienste vor.</p>
              </motion.div>
            ) : (
              <motion.div className="shifts-list" key={`${view}-${selectedDate}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredShifts.map((shift) => (
                  <motion.article className="shift-card" key={shift.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="shift-card-header">
                      <div>
                        <span>{formatDate(shift.date)} · {timeRange(shift)}</span>
                        <h2>{shift.title}</h2>
                      </div>
                      <div className="client-badges"><span className={`shift-type-badge type-${shift.shift_type}`}>{typeLabels[shift.shift_type]}</span><span className={`shift-status ${shift.status}`}>{statusLabels[shift.status]}</span></div>
                    </div>
                    <div className="shift-details-grid">
                      <div><span>Klient</span><strong>{value(shift.client_name)}</strong></div>
                      <div><span>Standort</span><strong>{value(shift.location_name)}</strong></div>
                      <div><span>Notiz</span><strong>{value(shift.notes)}</strong></div>
                    </div>
                    <div className="location-actions">
                      <button className="button secondary" type="button" onClick={() => setSelectedShift(shift)}><Eye size={15} />Ansehen</button>
                      {shift.tour_id ? <Link className="button secondary" href="/mitarbeiter/tour"><Route size={15} />Tour öffnen</Link> : null}
                      <Link className="button secondary" href={`/mitarbeiter/zeiterfassung?shift_id=${shift.id}`}><Timer size={15} />Zeit erfassen</Link>
                      {!shift.seen_at ? <button className="button secondary" type="button" onClick={() => markSeen(shift)}>Als gesehen markieren</button> : null}
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {selectedShift ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedShift(null)}>
            <motion.div className="modal-panel staff-shift-detail" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div><h2>{selectedShift.title}</h2><p>{formatDate(selectedShift.date)} · {timeRange(selectedShift)}</p></div>
                <button className="icon-button" type="button" onClick={() => setSelectedShift(null)} aria-label="Schließen"><X size={18} /></button>
              </div>
              <div className="shift-details-grid">
                <div><span>Diensttyp</span><strong>{typeLabels[selectedShift.shift_type]}</strong></div>
                <div><span>Status</span><strong>{statusLabels[selectedShift.status]}</strong></div>
                <div><span>Standort</span><strong>{value(selectedShift.location_name)}</strong></div>
                <div><span>Klient</span><strong>{value(selectedShift.client_name)}</strong></div>
                <div><span>Hinweise</span><strong>{value(selectedShift.notes)}</strong></div>
                <div><span>Tour</span><strong>{selectedShift.tour_id ? "Zugeordnet" : "Nicht hinterlegt"}</strong></div>
                <div><span>Gesehen</span><strong>{formatDateTime(selectedShift.seen_at)}</strong></div>
                <div><span>Zuletzt aktualisiert</span><strong>{formatDateTime(selectedShift.updated_at)}</strong></div>
              </div>
              <div className="location-actions">
                {selectedShift.tour_id ? <Link className="button secondary" href="/mitarbeiter/tour"><Route size={15} />Tour öffnen</Link> : null}
                <Link className="button secondary" href={`/mitarbeiter/zeiterfassung?shift_id=${selectedShift.id}`}><Timer size={15} />Zeit erfassen</Link>
                {!selectedShift.seen_at ? <button className="button secondary" type="button" onClick={() => markSeen(selectedShift)}>Als gesehen markieren</button> : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
