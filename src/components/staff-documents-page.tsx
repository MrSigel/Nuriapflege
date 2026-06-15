"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, Eye, FileText, FileUp, FilterX, Image, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ClientRef = { id: string; first_name: string; last_name: string; city: string | null };
type ShiftRef = { id: string; client_id: string | null; title: string; date: string; suggested_end_time: string | null; status: string };
type TourRef = { id: string; title: string; tour_date: string; status: string };
type StopRef = { id: string; tour_id: string; client_id: string | null; shift_id: string | null; suggested_time: string | null; status: string; completed_at: string | null };
type AssignedStop = StopRef & { tour: TourRef | null };
type Assignment = { client: ClientRef; shifts: ShiftRef[]; stops: AssignedStop[]; accessUntil: string | null; canUpload: boolean };
type StaffDocument = {
  id: string; company_id: string; client_id: string | null; employee_id: string | null; shift_id: string | null; tour_id: string | null; tour_stop_id: string | null; uploaded_by: string | null;
  title: string; description: string | null; category: string; file_name: string | null; file_path: string | null; file_type: string | null; mime_type: string | null; file_size: number;
  storage_bucket: string; status: string; visibility: string; uploaded_at: string; updated_at: string; deleted_at: string | null;
};
type Profile = { userId: string; companyId: string };

const bucket = "company-documents";
const maxSize = 10 * 1024 * 1024;
const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const categories = [["verordnung", "Verordnung"], ["arztbrief", "Arztbrief"], ["pflegeunterlage", "Pflegeunterlage"], ["foto", "Foto"], ["sonstiges", "Sonstiges"]];
const statusLabels: Record<string, string> = { active: "Hochgeladen", pending_review: "Zur Prüfung", reviewed: "Geprüft", archived: "Archiviert", deleted: "Gelöscht" };
const visibilityLabels: Record<string, string> = { care_team: "Pflegeteam", management: "Leitung", client_related: "Klient", employee_private: "Privat" };

function todayKey() { return new Date().toISOString().slice(0, 10); }
function weekEndKey(today: string) { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() + 6); return d.toISOString().slice(0, 10); }
function startWindowKey(today: string) { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }
function endWindowKey(today: string) { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); }
function value(input: string | null | undefined) { return input && input.trim() ? input : "Nicht hinterlegt"; }
function clientName(client?: ClientRef | null) { return client ? [client.first_name, client.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt" : "Nicht hinterlegt"; }
function dateLabel(input: string | null | undefined) { return input ? new Intl.DateTimeFormat("de-DE").format(new Date(input)) : "Nicht hinterlegt"; }
function sizeLabel(bytes: number | null | undefined) { const n = Number(bytes ?? 0); if (n < 1024) return `${n} B`; if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`; return `${(n / 1024 / 1024).toFixed(1)} MB`; }
function addHours(input: string, hours: number) { const d = new Date(input); d.setHours(d.getHours() + hours); return d.toISOString(); }
function safeName(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120); }
function catLabel(category: string) { return categories.find(([key]) => key === category)?.[1] ?? category; }

export function StaffDocumentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<StaffDocument | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [source, setSource] = useState("all");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ client_id: "", shift_id: "", tour_id: "", tour_stop_id: "", category: "verordnung", title: "", description: "", visibility: "management" });

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Login ist aktuell nicht verfügbar."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign("/login"); return; }
    const { data: profileRow } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).maybeSingle();
    if (!profileRow?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profileRow.role)) { setError("Diese Seite ist für Ihr Benutzerprofil nicht freigegeben."); setLoading(false); return; }

    const today = todayKey();
    const [{ data: shiftRows }, { data: tourRows }] = await Promise.all([
      supabase.from("shifts").select("id, client_id, title, date, suggested_end_time, status").eq("company_id", profileRow.company_id).eq("employee_id", user.id).gte("date", startWindowKey(today)).lte("date", endWindowKey(today)),
      supabase.from("tours").select("id, title, tour_date, status").eq("company_id", profileRow.company_id).eq("employee_id", user.id).gte("tour_date", startWindowKey(today)).lte("tour_date", endWindowKey(today)),
    ]);
    const tours = (tourRows ?? []) as TourRef[];
    const { data: stopRows } = tours.length ? await supabase.from("tour_stops").select("id, tour_id, client_id, shift_id, suggested_time, status, completed_at").eq("company_id", profileRow.company_id).in("tour_id", tours.map((tour) => tour.id)) : { data: [] };
    const shifts = (shiftRows ?? []) as ShiftRef[];
    const stops: AssignedStop[] = ((stopRows ?? []) as StopRef[]).map((stop) => ({ ...stop, tour: tours.find((tour) => tour.id === stop.tour_id) ?? null }));
    const allowedClientIds = Array.from(new Set([...shifts.map((shift) => shift.client_id), ...stops.map((stop) => stop.client_id)].filter(Boolean))) as string[];
    const [{ data: clientRows }, { data: docRows }] = await Promise.all([
      allowedClientIds.length ? supabase.from("clients").select("id, first_name, last_name, city").eq("company_id", profileRow.company_id).in("id", allowedClientIds) : Promise.resolve({ data: [] }),
      allowedClientIds.length ? supabase.from("documents").select("id, company_id, client_id, employee_id, shift_id, tour_id, tour_stop_id, uploaded_by, title, description, category, file_name, file_path, file_type, mime_type, file_size, storage_bucket, status, visibility, uploaded_at, updated_at, deleted_at").eq("company_id", profileRow.company_id).in("client_id", allowedClientIds).is("deleted_at", null).neq("status", "deleted").or(`uploaded_by.eq.${user.id},employee_id.eq.${user.id},visibility.eq.care_team`).order("uploaded_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);

    const now = Date.now();
    const clients = new Map((clientRows ?? []).map((client) => [client.id, client as ClientRef]));
    const nextAssignments = allowedClientIds.map((id) => {
      const client = clients.get(id);
      if (!client) return null;
      const clientShifts = shifts.filter((shift) => shift.client_id === id);
      const clientStops = stops.filter((stop) => stop.client_id === id);
      const expiries = [
        ...clientShifts.map((shift) => addHours(`${shift.date}T${shift.suggested_end_time ?? "23:59:59"}`, 24)),
        ...clientStops.map((stop) => addHours(stop.completed_at ?? `${stop.tour?.tour_date ?? today}T23:59:59`, 24)),
      ].sort();
      const accessUntil = expiries.at(-1) ?? null;
      return { client, shifts: clientShifts, stops: clientStops, accessUntil, canUpload: Boolean(accessUntil && new Date(accessUntil).getTime() >= now) };
    }).filter((item): item is Assignment => Boolean(item));
    setProfile({ companyId: profileRow.company_id, userId: user.id });
    setAssignments(nextAssignments);
    setDocuments((docRows ?? []) as StaffDocument[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const clientMap = useMemo(() => new Map(assignments.map((item) => [item.client.id, item.client])), [assignments]);
  const assignmentMap = useMemo(() => new Map(assignments.map((item) => [item.client.id, item])), [assignments]);
  const today = todayKey();
  const weekEnd = weekEndKey(today);
  const filtered = useMemo(() => documents.filter((doc) => {
    const client = doc.client_id ? clientMap.get(doc.client_id) : null;
    const haystack = [doc.title, doc.file_name, doc.category, clientName(client)].join(" ").toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (category === "all" || doc.category === category)
      && (status === "all" || doc.status === status)
      && (clientId === "all" || doc.client_id === clientId)
      && (!date || doc.uploaded_at.slice(0, 10) === date)
      && (source === "all" || (source === "shift" ? Boolean(doc.shift_id) : Boolean(doc.tour_id || doc.tour_stop_id)));
  }), [category, clientId, clientMap, date, documents, query, source, status]);

  const stats = [
    ["Eigene Uploads heute", documents.filter((doc) => doc.uploaded_by === profile?.userId && doc.uploaded_at.slice(0, 10) === today).length, CalendarDays],
    ["Eigene Uploads diese Woche", documents.filter((doc) => doc.uploaded_by === profile?.userId && doc.uploaded_at.slice(0, 10) >= today && doc.uploaded_at.slice(0, 10) <= weekEnd).length, Upload],
    ["Zur Prüfung", documents.filter((doc) => doc.status === "pending_review").length, Clock3],
    ["Hochgeladene Verordnungen", documents.filter((doc) => doc.category === "verordnung").length, FileText],
    ["Eigene Fotos", documents.filter((doc) => doc.uploaded_by === profile?.userId && (doc.category === "foto" || doc.mime_type?.startsWith("image/"))).length, Image],
    ["Uploads löschbar", documents.filter((doc) => canDelete(doc)).length, Trash2],
  ] as const;

  function canDelete(doc: StaffDocument) {
    return doc.uploaded_by === profile?.userId && !["reviewed", "archived"].includes(doc.status) && Date.now() - new Date(doc.uploaded_at).getTime() <= 24 * 60 * 60 * 1000;
  }

  function resetForm() {
    setForm({ client_id: "", shift_id: "", tour_id: "", tour_stop_id: "", category: "verordnung", title: "", description: "", visibility: "management" });
    setFile(null);
  }
  function closeUpload() {
    if ((form.title || form.description || file) && !window.confirm("Änderungen verwerfen?")) return;
    setOpen(false);
    resetForm();
  }
  function updateCategory(next: string) {
    setForm((current) => ({ ...current, category: next, visibility: next === "verordnung" || next === "arztbrief" ? "management" : "care_team" }));
  }
  function onFile(next: File | null) {
    if (!next) { setFile(null); return; }
    if (!allowedTypes.includes(next.type)) { setNotice("Dieser Dateityp wird nicht unterstützt."); return; }
    if (next.size > maxSize) { setNotice("Die Datei ist zu groß. Maximal erlaubt sind 10 MB."); return; }
    setFile(next);
    setForm((current) => ({ ...current, title: current.title || next.name.replace(/\.[^.]+$/, "") }));
  }

  async function uploadDocument() {
    if (!profile || !form.client_id || !form.category || !form.title.trim() || !file) { setNotice("Bitte füllen Sie alle Pflichtfelder aus."); return; }
    const assignment = assignmentMap.get(form.client_id);
    if (!assignment?.canUpload) { setNotice("Für diesen Klienten ist aktuell kein Upload erlaubt."); return; }
    if (!allowedTypes.includes(file.type)) { setNotice("Dieser Dateityp wird nicht unterstützt."); return; }
    if (file.size > maxSize) { setNotice("Die Datei ist zu groß. Maximal erlaubt sind 10 MB."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setUploading(true);
    const id = crypto.randomUUID();
    const now = new Date();
    const path = `${profile.companyId}/${form.client_id}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${id}_${safeName(file.name)}`;
    const uploaded = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (uploaded.error) { setNotice("Upload konnte nicht gespeichert werden."); setUploading(false); return; }
    const inserted = await supabase.from("documents").insert({
      id,
      company_id: profile.companyId,
      client_id: form.client_id,
      employee_id: profile.userId,
      shift_id: form.shift_id || null,
      tour_id: form.tour_id || null,
      tour_stop_id: form.tour_stop_id || null,
      uploaded_by: profile.userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      visibility: form.visibility,
      status: "pending_review",
      file_name: file.name,
      file_path: path,
      file_type: safeName(file.name).split(".").pop()?.toLowerCase() ?? null,
      mime_type: file.type,
      file_size: file.size,
      storage_bucket: bucket,
      uploaded_at: now.toISOString(),
    });
    if (inserted.error) {
      await supabase.storage.from(bucket).remove([path]);
      setNotice("Dokumentdaten konnten nicht gespeichert werden.");
      setUploading(false);
      return;
    }
    setNotice("Dokument wurde hochgeladen.");
    setOpen(false);
    resetForm();
    setUploading(false);
    await load();
  }

  async function deleteDocument(doc: StaffDocument) {
    if (!profile || !canDelete(doc) || !window.confirm("Möchten Sie dieses Dokument wirklich löschen?")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("documents").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("company_id", profile.companyId).eq("id", doc.id).eq("uploaded_by", profile.userId);
    if (deleteError) { setNotice("Dokument konnte nicht gelöscht werden."); return; }
    setNotice("Dokument wurde gelöscht.");
    setDocuments((current) => current.filter((item) => item.id !== doc.id));
  }

  const selectedAssignment = assignmentMap.get(form.client_id);

  return (
    <motion.section className="page documents-page staff-documents-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="documents-header"><div><h1>Dokumente hochladen</h1><p>Laden Sie Dokumente zu Ihren zugewiesenen Patienten hoch.</p></div><div className="documents-header-actions"><motion.button className="button" type="button" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><FileUp size={16} />Dokument hochladen</motion.button></div></div>
      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}
      <div className="documents-stats-grid">{stats.map(([label, amount, Icon], index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{amount}</strong></motion.div>)}</div>
      <motion.div className="documents-filter-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label><Search size={16} />Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Klient, Kategorie, Datei" /></label>
        <label>Kategorie<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Alle</option>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option><option value="pending_review">Zur Prüfung</option><option value="active">Hochgeladen</option><option value="reviewed">Geprüft</option><option value="archived">Archiviert</option></select></label>
        <label>Klient<select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="all">Alle</option>{assignments.map((item) => <option key={item.client.id} value={item.client.id}>{clientName(item.client)}</option>)}</select></label>
        <label>Datum<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label>Bezug<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Alle</option><option value="shift">Dienst</option><option value="tour">Tour/Tourstopp</option></select></label>
        <button className="button secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); setClientId("all"); setSource("all"); setDate(""); }}><FilterX size={16} />Zurücksetzen</button>
      </motion.div>
      {error ? <motion.div className="empty-state"><strong>{error}</strong></motion.div> : loading ? <motion.div className="empty-state"><strong>Dokumente werden geladen.</strong></motion.div> : filtered.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>Noch keine Dokumente hochgeladen.</strong><p>Laden Sie ein Dokument zu einem aktuell zugewiesenen Patienten hoch.</p><button className="button" type="button" onClick={() => setOpen(true)}><FileUp size={16} />Dokument hochladen</button></motion.div> : (
        <AnimatePresence mode="wait"><motion.div className="documents-list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {filtered.map((doc, index) => {
            const client = doc.client_id ? clientMap.get(doc.client_id) : null;
            return <motion.article className="document-card" key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
              <div className="document-card-header"><div><span>{value(doc.file_name)}</span><h2><FileText size={18} />{doc.title}</h2></div><div className="client-badges"><span className="document-category">{catLabel(doc.category)}</span><span className={`document-status ${doc.status}`}>{statusLabels[doc.status] ?? value(doc.status)}</span></div></div>
              <div className="document-details-grid"><div><span>Klient</span><strong>{clientName(client)}</strong></div><div><span>Datum</span><strong>{dateLabel(doc.uploaded_at)}</strong></div><div><span>Dateityp</span><strong>{value(doc.file_type?.toUpperCase())}</strong></div><div><span>Dateigröße</span><strong>{sizeLabel(doc.file_size)}</strong></div><div><span>Bezug</span><strong>{doc.tour_stop_id ? "Tourstopp" : doc.tour_id ? "Tour" : doc.shift_id ? "Dienst" : "Nicht hinterlegt"}</strong></div><div><span>Hochgeladen von</span><strong>{doc.uploaded_by === profile?.userId ? "Eigener Upload" : "Pflegeteam"}</strong></div><div><span>Notiz</span><strong>{value(doc.description)}</strong></div></div>
              <div className="location-actions"><button className="button secondary" type="button" onClick={() => setDetail(doc)}><Eye size={15} />Ansehen</button><button className="button secondary" type="button" disabled title="Vorschau wird vorbereitet"><Eye size={15} />Vorschau wird vorbereitet</button>{canDelete(doc) ? <button className="button secondary" type="button" onClick={() => deleteDocument(doc)}><Trash2 size={15} />Löschen</button> : <button className="button secondary" type="button" disabled title="Löschen wird vorbereitet."><Trash2 size={15} />Löschen wird vorbereitet.</button>}</div>
            </motion.article>;
          })}
        </motion.div></AnimatePresence>
      )}
      <AnimatePresence>{detail ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{detail.title}</h2><p>{catLabel(detail.category)}</p></div><button className="icon-button" type="button" onClick={() => setDetail(null)}><X size={18} /></button></div><div className="document-details-grid"><div><span>Klient</span><strong>{clientName(detail.client_id ? clientMap.get(detail.client_id) : null)}</strong></div><div><span>Dateiname</span><strong>{value(detail.file_name)}</strong></div><div><span>Dateityp</span><strong>{value(detail.file_type?.toUpperCase())}</strong></div><div><span>Dateigröße</span><strong>{sizeLabel(detail.file_size)}</strong></div><div><span>Status</span><strong>{statusLabels[detail.status] ?? value(detail.status)}</strong></div><div><span>Sichtbarkeit</span><strong>{visibilityLabels[detail.visibility] ?? value(detail.visibility)}</strong></div><div><span>Bezug</span><strong>{detail.tour_stop_id ? "Tourstopp" : detail.tour_id ? "Tour" : detail.shift_id ? "Dienst" : "Nicht hinterlegt"}</strong></div><div><span>Hochgeladen am</span><strong>{dateLabel(detail.uploaded_at)}</strong></div></div><div className="location-detail-panel"><p>{value(detail.description)}</p></div></motion.div></motion.div> : null}</AnimatePresence>
      <AnimatePresence>{open ? <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeUpload}><motion.div className="modal-panel client-modal-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>Dokument hochladen</h2><p>{form.client_id ? clientName(clientMap.get(form.client_id)) : "Zugewiesenen Klienten wählen"}</p></div><button className="icon-button" type="button" onClick={closeUpload}><X size={18} /></button></div><div className="documents-form">
        <label>Klient<select required value={form.client_id} onChange={(event) => setForm((current) => ({ ...current, client_id: event.target.value, shift_id: "", tour_id: "", tour_stop_id: "" }))}><option value="">Klient wählen</option>{assignments.filter((item) => item.canUpload).map((item) => <option key={item.client.id} value={item.client.id}>{clientName(item.client)}</option>)}</select></label>
        <label>Kategorie<select required value={form.category} onChange={(event) => updateCategory(event.target.value)}>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Dienst<select value={form.shift_id} onChange={(event) => setForm((current) => ({ ...current, shift_id: event.target.value }))}><option value="">Kein Dienst</option>{selectedAssignment?.shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.title}</option>)}</select></label>
        <label>Tour<select value={form.tour_id} onChange={(event) => setForm((current) => ({ ...current, tour_id: event.target.value }))}><option value="">Keine Tour</option>{selectedAssignment?.stops.map((stop) => stop.tour).filter(Boolean).map((tour) => <option key={tour!.id} value={tour!.id}>{tour!.title}</option>)}</select></label>
        <label>Tourstopp<select value={form.tour_stop_id} onChange={(event) => setForm((current) => ({ ...current, tour_stop_id: event.target.value }))}><option value="">Kein Tourstopp</option>{selectedAssignment?.stops.map((stop) => <option key={stop.id} value={stop.id}>{value(stop.suggested_time?.slice(0, 5))}</option>)}</select></label>
        <label>Sichtbarkeit<select value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}><option value="management">Leitung</option><option value="care_team">Pflegeteam</option></select></label>
        <label className="documents-form-wide">Titel<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="documents-form-wide">Datei auswählen<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => onFile(event.target.files?.[0] ?? null)} /></label>
        <label className="documents-form-wide">Foto aufnehmen<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => onFile(event.target.files?.[0] ?? null)} /></label>
        <label className="documents-form-wide">Notiz<textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
        {file ? <div className="documents-form-wide location-detail-panel"><p>{file.name} · {sizeLabel(file.size)}</p></div> : null}
        <div className="care-form-actions documents-form-wide"><button className="button secondary" type="button" onClick={closeUpload}>Abbrechen</button><button className="button" type="button" onClick={uploadDocument} disabled={uploading}>{uploading ? "Wird hochgeladen" : "Hochladen"}</button></div>
      </div></motion.div></motion.div> : null}</AnimatePresence>
    </motion.section>
  );
}
