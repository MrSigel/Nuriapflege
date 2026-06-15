"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BriefcaseBusiness, LockKeyhole, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Profile = {
  id: string; company_id: string; role: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; staff_code: string | null;
  job_title: string | null; qualification: string | null; status: string | null; street: string | null; house_number: string | null; postal_code: string | null; city: string | null;
  notification_settings: Record<string, boolean> | null; profile_image_path: string | null; created_at: string; updated_at: string;
};
type LocationRef = { id: string; name: string };
type TabKey = "personal" | "contact" | "work" | "security" | "notifications";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "personal", label: "Persönliche Daten" },
  { key: "contact", label: "Kontakt" },
  { key: "work", label: "Berufliche Angaben" },
  { key: "security", label: "Sicherheit" },
  { key: "notifications", label: "Benachrichtigungen" },
];
const roleLabels: Record<string, string> = { mitarbeiter: "Mitarbeiter", pflegefachkraft: "Pflegefachkraft", pdl: "Pflegedienstleitung", verwaltung: "Verwaltung", inhaber: "Inhaber" };
const statusLabels: Record<string, string> = { active: "Aktiv", inactive: "Inaktiv", invited: "Eingeladen", pending: "Ausstehend" };
const notificationLabels: Record<string, string> = { new_message: "Neue Nachricht", new_tour: "Neue Tour", shift_change: "Dienstplanänderung", handover_note: "Übergabe/Notiz", document_hint: "Dokument-Hinweis" };

function value(input: string | null | undefined) { return input && input.trim() ? input : "Nicht hinterlegt"; }
function fullName(profile: Profile | null) { return profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Nicht hinterlegt" : "Nicht hinterlegt"; }
function initials(profile: Profile | null) { return fullName(profile).split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NP"; }
function validPhone(phone: string) { return !phone || /^[0-9+()/\s.-]{5,30}$/.test(phone); }
function validPostal(postal: string) { return !postal || /^[0-9]{4,6}$/.test(postal); }

export function StaffProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locations, setLocations] = useState<LocationRef[]>([]);
  const [tab, setTab] = useState<TabKey>("personal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", staff_code: "", phone: "", street: "", house_number: "", postal_code: "", city: "" });
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Ihr Benutzerprofil konnte nicht geladen werden."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign("/login"); return; }
    const { data: row } = await supabase.from("profiles").select("id, company_id, role, first_name, last_name, email, phone, staff_code, job_title, qualification, status, street, house_number, postal_code, city, notification_settings, profile_image_path, created_at, updated_at").eq("id", user.id).maybeSingle();
    if (!row?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(row.role)) { setError("Ihr Benutzerprofil konnte nicht geladen werden."); setLoading(false); return; }
    const { data: locationRows } = await supabase.from("employee_locations").select("location:company_locations(id, name)").eq("company_id", row.company_id).eq("employee_id", user.id);
    const profileRow = row as Profile;
    setProfile(profileRow);
    setForm({ first_name: profileRow.first_name ?? "", last_name: profileRow.last_name ?? "", staff_code: profileRow.staff_code ?? "", phone: profileRow.phone ?? "", street: profileRow.street ?? "", house_number: profileRow.house_number ?? "", postal_code: profileRow.postal_code ?? "", city: profileRow.city ?? "" });
    setNotifications(profileRow.notification_settings ?? { new_message: true, new_tour: true, shift_change: true, handover_note: true, document_hint: true });
    setLocations((locationRows ?? []).map((item: any) => Array.isArray(item.location) ? item.location[0] : item.location).filter(Boolean));
    setDirty(false);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => [
    ["Rolle", profile ? roleLabels[profile.role] ?? profile.role : "Nicht hinterlegt", ShieldCheck],
    ["Kürzel", value(profile?.staff_code), UserRound],
    ["Telefon", value(profile?.phone), Phone],
    ["E-Mail", value(profile?.email), Mail],
    ["Qualifikation", value(profile?.qualification), BriefcaseBusiness],
  ] as const, [profile]);

  function updateForm(key: keyof typeof form, next: string) { setForm((current) => ({ ...current, [key]: next })); setDirty(true); }
  function updateNotification(key: string, next: boolean) { setNotifications((current) => ({ ...current, [key]: next })); setDirty(true); }
  function switchTab(next: TabKey) { if (dirty && !window.confirm("Änderungen verwerfen?")) return; setTab(next); setDirty(false); }

  async function savePersonal() {
    if (!profile) return;
    if (!form.first_name.trim() || !form.last_name.trim()) { setNotice("Vorname und Nachname sind erforderlich."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: updateError } = await supabase.from("profiles").update({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), staff_code: form.staff_code.trim() || null, updated_at: new Date().toISOString() }).eq("company_id", profile.company_id).eq("id", profile.id);
    if (updateError) { setNotice("Profil konnte nicht gespeichert werden."); return; }
    setNotice("Änderungen wurden gespeichert.");
    await load();
  }

  async function saveContact() {
    if (!profile) return;
    if (!validPhone(form.phone)) { setNotice("Telefonnummer ist ungültig."); return; }
    if (!validPostal(form.postal_code)) { setNotice("PLZ ist ungültig."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: updateError } = await supabase.from("profiles").update({ phone: form.phone.trim() || null, street: form.street.trim() || null, house_number: form.house_number.trim() || null, postal_code: form.postal_code.trim() || null, city: form.city.trim() || null, updated_at: new Date().toISOString() }).eq("company_id", profile.company_id).eq("id", profile.id);
    if (updateError) { setNotice("Kontaktdaten konnten nicht gespeichert werden."); return; }
    setNotice("Änderungen wurden gespeichert.");
    await load();
  }

  async function saveNotifications() {
    if (!profile) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: updateError } = await supabase.from("profiles").update({ notification_settings: notifications, updated_at: new Date().toISOString() }).eq("company_id", profile.company_id).eq("id", profile.id);
    if (updateError) { setNotice("Benachrichtigungen konnten nicht gespeichert werden."); return; }
    setNotice("Benachrichtigungen wurden gespeichert.");
    await load();
  }

  return (
    <motion.section className="page clients-page staff-profile-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="clients-header"><div><h1>Mein Profil</h1><p>Ihre persönlichen Angaben und Einstellungen.</p></div></div>
      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}
      {error ? <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>{error}</strong><p>Bitte melden Sie sich erneut an oder kontaktieren Sie den Support.</p></motion.div> : loading ? <motion.div className="empty-state"><strong>Profil wird geladen.</strong></motion.div> : profile ? <>
        <motion.article className="client-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="client-card-header"><div className="profile-card-main"><span className="conversation-avatar">{initials(profile)}</span><div><span>{roleLabels[profile.role] ?? profile.role}</span><h2>{fullName(profile)}</h2><p>{value(profile.email)}</p></div></div><span className={`location-status ${profile.status ?? "active"}`}>{statusLabels[profile.status ?? "active"] ?? value(profile.status)}</span></div>
          <div className="client-details-grid">{stats.map(([label, content, Icon]) => <div key={label}><span>{label}</span><strong><Icon size={15} /> {content}</strong></div>)}</div>
        </motion.article>
        <div className="settings-tabs staff-tabs">{tabs.map((item) => <motion.button key={item.key} className={`settings-tab ${tab === item.key ? "active" : ""}`} type="button" onClick={() => switchTab(item.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>{item.label}</motion.button>)}</div>
        <AnimatePresence mode="wait"><motion.div className="client-card" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {tab === "personal" ? <div className="client-form"><label>Vorname<input value={form.first_name} onChange={(event) => updateForm("first_name", event.target.value)} /></label><label>Nachname<input value={form.last_name} onChange={(event) => updateForm("last_name", event.target.value)} /></label><label>Kürzel<input value={form.staff_code} onChange={(event) => updateForm("staff_code", event.target.value)} /></label><label>Profilbild<button className="button secondary" type="button" disabled>Profilbild-Upload wird vorbereitet.</button></label><div className="client-form-actions client-form-wide"><button className="button" type="button" onClick={savePersonal}><Save size={16} />Änderungen speichern</button></div></div> : null}
          {tab === "contact" ? <div className="client-form"><label>Telefonnummer<input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} /></label><label>Straße<input value={form.street} onChange={(event) => updateForm("street", event.target.value)} /></label><label>Hausnummer<input value={form.house_number} onChange={(event) => updateForm("house_number", event.target.value)} /></label><label>PLZ<input value={form.postal_code} onChange={(event) => updateForm("postal_code", event.target.value)} /></label><label>Ort<input value={form.city} onChange={(event) => updateForm("city", event.target.value)} /></label><div className="client-form-actions client-form-wide"><button className="button" type="button" onClick={saveContact}><Save size={16} />Änderungen speichern</button></div></div> : null}
          {tab === "work" ? <div className="client-details-grid"><div><span>Rolle</span><strong>{roleLabels[profile.role] ?? profile.role}</strong></div><div><span>Position</span><strong>{value(profile.job_title)}</strong></div><div><span>Qualifikation</span><strong>{value(profile.qualification)}</strong></div><div><span>Beschäftigungsart</span><strong>Nicht hinterlegt</strong></div><div><span>Standort</span><strong>{locations.length ? locations.map((item) => item.name).join(", ") : "Nicht hinterlegt"}</strong></div><div><span>Kürzel</span><strong>{value(profile.staff_code)}</strong></div></div> : null}
          {tab === "security" ? <div className="client-details-grid"><div><span>E-Mail</span><strong>{value(profile.email)}</strong></div><div><span>Hinweis</span><strong>E-Mail-Adresse kann aktuell nur durch die Verwaltung geändert werden.</strong></div><div><span>Passwort</span><strong><button className="button secondary" type="button" disabled><LockKeyhole size={15} />Passwortänderung wird vorbereitet.</button></strong></div></div> : null}
          {tab === "notifications" ? <div className="client-form">{Object.entries(notificationLabels).map(([key, label]) => <label className="checkbox-row" key={key}><input type="checkbox" checked={Boolean(notifications[key])} onChange={(event) => updateNotification(key, event.target.checked)} /><span>{label}</span></label>)}<div className="client-form-actions client-form-wide"><button className="button" type="button" onClick={saveNotifications}><Bell size={16} />Änderungen speichern</button></div></div> : null}
        </motion.div></AnimatePresence>
      </> : null}
    </motion.section>
  );
}
