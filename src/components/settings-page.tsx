"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SettingsActionState } from "@/lib/settings-actions";
import type { CompanySettingsData } from "@/lib/settings";

type SettingsPageProps = {
  data: CompanySettingsData;
  saveAction: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
};

const tabs = [
  { id: "company", label: "Unternehmen", icon: Building2 },
  { id: "contact", label: "Kontakt & Adresse", icon: MapPin },
  { id: "billing", label: "Abrechnung & Zahlung", icon: CreditCard },
  { id: "system", label: "System", icon: Settings },
  { id: "roles", label: "Rollen-Grundlagen", icon: UserCog },
  { id: "notifications", label: "Benachrichtigungen", icon: Bell },
  { id: "security", label: "Datenschutz & Sicherheit", icon: ShieldCheck },
  { id: "account", label: "Mein Konto", icon: LockKeyhole },
] as const;

type TabId = (typeof tabs)[number]["id"];

const initialActionState: SettingsActionState = { ok: false, message: "" };

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  readOnly = false,
  hint,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  readOnly?: boolean;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} defaultValue={defaultValue ?? ""} readOnly={readOnly} required={required} />
      {hint ? <span>{hint}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={defaultValue ?? options[0]?.value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <motion.label className="settings-toggle-row" whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
      <span>{label}</span>
      <span className="switch">
        <input name={name} type="checkbox" defaultChecked={defaultChecked} />
        <motion.span layout />
      </span>
    </motion.label>
  );
}

function EmptyValue() {
  return <motion.div className="compact-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Noch nicht hinterlegt.</motion.div>;
}

export function SettingsPage({ data, saveAction }: SettingsPageProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const company = data.company;
  const owner = data.owner;
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [dirty, setDirty] = useState(false);
  const [actionState, formAction, pending] = useActionState(saveAction, initialActionState);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    window.localStorage.setItem("nuria-theme", "light");
  }, []);

  useEffect(() => {
    if (actionState.ok && actionState.message) {
      setDirty(false);
      router.refresh();
    }
  }, [actionState, router]);

  const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);
  const CurrentIcon = currentTab.icon;
  const disabled = !dirty || pending;

  function handleReset() {
    setDirty(false);
  }

  return (
    <motion.section className="page settings-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <form ref={formRef} action={formAction} className="settings-content" onChange={() => setDirty(true)} onReset={handleReset}>
        <div className="settings-header-panel">
          <div>
            <h1>Einstellungen</h1>
            <p>Unternehmensdaten, Systemwerte und persönliche Einstellungen verwalten.</p>
          </div>
          <div className="actions">
            <motion.button className="button" type="submit" disabled={disabled} whileTap={{ scale: 0.98 }}>
              <Save size={16} />
              {pending ? "Speichern..." : "Änderungen speichern"}
            </motion.button>
            <motion.button className="button secondary" type="reset" disabled={!dirty || pending} whileTap={{ scale: 0.98 }}>
              <RotateCcw size={16} />
              Änderungen verwerfen
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {actionState.message ? (
            <motion.div
              key={`${actionState.ok}-${actionState.message}`}
              className={`settings-alert ${actionState.ok ? "success" : "error"}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {actionState.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {actionState.message}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="settings-tabs" role="tablist" aria-label="Einstellungen">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <motion.button
                key={tab.id}
                type="button"
                className={`settings-tab ${active ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.98 }}
                role="tab"
                aria-selected={active}
              >
                <Icon size={16} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeTab}
            className="settings-card settings-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <h2>
              <CurrentIcon size={18} />
              {currentTab.label}
            </h2>

            {activeTab === "company" ? (
              <div className="settings-form-grid">
                <Field label="Pflegedienstname" name="name" defaultValue={company?.name} required />
                <Field label="Rechtlicher Name" name="legal_name" defaultValue={company?.legal_name} />
                <Field label="IK-Nummer / Institutionskennzeichen" name="ik_number" defaultValue={company?.ik_number} hint="Die IK-Nummer kann nachgereicht werden." />
                <Field label="Website" name="website" type="url" defaultValue={company?.website} />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={company?.status ?? "active"}
                  options={[
                    { value: "active", label: "Aktiv" },
                    { value: "inactive", label: "Inaktiv" },
                    { value: "locked", label: "Gesperrt" },
                  ]}
                />
              </div>
            ) : null}

            {activeTab === "contact" ? (
              <div className="settings-form-grid">
                <Field label="E-Mail" name="email" type="email" defaultValue={company?.email} />
                <Field label="Telefonnummer" name="phone" defaultValue={company?.phone} />
                <Field label="Straße" name="street" defaultValue={company?.street} />
                <Field label="Hausnummer" name="house_number" defaultValue={company?.house_number} />
                <Field label="PLZ" name="postal_code" defaultValue={company?.postal_code} />
                <Field label="Ort" name="city" defaultValue={company?.city} />
                <Field label="Bundesland" name="state" defaultValue={company?.state} />
                <Field label="Land" name="country" defaultValue={company?.country} />
              </div>
            ) : null}

            {activeTab === "billing" ? (
              <div className="settings-form-grid">
                <Field label="Rechnungs-E-Mail" name="billing_email" type="email" defaultValue={company?.billing_email} />
                <Field label="Steuernummer" name="tax_number" defaultValue={company?.tax_number} />
                <Field label="Aktueller Tarif" name="package_label_display" defaultValue={`${data.pricing.monthlyPriceEuro} EUR / Monat`} readOnly />
                <Field label="Paket-ID" name="package_id_display" defaultValue={company?.package_id ?? data.pricing.packageId} readOnly />
                <SelectField
                  label="Zahlungsintervall"
                  name="billing_interval"
                  defaultValue={company?.billing_interval ?? "monthly"}
                  options={data.pricing.intervals.map((interval) => ({ value: interval.label, label: interval.label }))}
                />
                <div className="settings-readonly-field">
                  <span>Zahlungsstatus</span>
                  <strong className={`settings-payment-badge ${company?.payment_status ?? "unknown"}`}>{company?.payment_status ?? "Nicht hinterlegt"}</strong>
                </div>
              </div>
            ) : null}

            {activeTab === "system" ? (
              <div className="settings-form-grid">
                <SelectField label="Zeitzone" name="timezone" defaultValue={data.settings.timezone} options={[{ value: "Europe/Berlin", label: "Europe/Berlin" }]} />
                <SelectField
                  label="Datumsformat"
                  name="date_format"
                  defaultValue={data.settings.date_format}
                  options={[
                    { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
                    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  ]}
                />
                <SelectField
                  label="Wochenstart"
                  name="week_start"
                  defaultValue={data.settings.week_start}
                  options={[
                    { value: "monday", label: "Montag" },
                    { value: "sunday", label: "Sonntag" },
                  ]}
                />
                <SelectField
                  label="Standardsprache"
                  name="default_language"
                  defaultValue={data.settings.default_language}
                  options={[
                    { value: "de", label: "Deutsch" },
                    { value: "en", label: "Englisch" },
                  ]}
                />
              </div>
            ) : null}

            {activeTab === "roles" ? (
              <div className="settings-toggle-list">
                <Toggle label="PDL darf Mitarbeiter verwalten" name="allow_pdl_manage_employees" defaultChecked={data.settings.allow_pdl_manage_employees} />
                <Toggle label="PDL darf Rollen verwalten" name="allow_pdl_manage_roles" defaultChecked={data.settings.allow_pdl_manage_roles} />
                <Toggle label="PDL darf Exporte erstellen" name="allow_pdl_export" defaultChecked={data.settings.allow_pdl_export} />
                <Toggle label="Verwaltung darf Exporte erstellen" name="allow_verwaltung_export" defaultChecked={data.settings.allow_verwaltung_export} />
              </div>
            ) : null}

            {activeTab === "notifications" ? (
              <div className="settings-toggle-list">
                <Toggle label="E-Mail-Benachrichtigungen" name="email_notifications" defaultChecked={data.userSettings.email_notifications} />
                <Toggle label="Interne Systemhinweise" name="internal_system_notifications" defaultChecked={data.userSettings.internal_system_notifications} />
                <Toggle label="Zahlungsstatus-Hinweise" name="payment_status_notifications" defaultChecked={data.userSettings.payment_status_notifications} />
                <Toggle label="Neue Nachrichten" name="new_message_notifications" defaultChecked={data.userSettings.new_message_notifications} />
                <Toggle label="Neue Dokumente" name="new_document_notifications" defaultChecked={data.userSettings.new_document_notifications} />
                <Toggle label="Neue Bewerbungen" name="new_application_notifications" defaultChecked={data.userSettings.new_application_notifications} />
              </div>
            ) : null}

            {activeTab === "security" ? (
              <div className="settings-security-panel">
                <p>Nuria Pflege ist auf rollenbasierte Zugriffe und mandantengetrennte Datenverwaltung ausgelegt.</p>
                <div className="settings-security-list">
                  {["Mandantentrennung", "Rollenbasierte Zugriffe", "Unternehmensbezogene Datenfilter", "Exportrechte nach Rolle"].map((item) => (
                    <motion.span key={item} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      <ShieldCheck size={16} />
                      {item}
                    </motion.span>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "account" ? (
              owner ? (
                <div className="settings-form-grid">
                  <Field label="Vorname" name="owner_first_name_display" defaultValue={owner.first_name} readOnly />
                  <Field label="Nachname" name="owner_last_name_display" defaultValue={owner.last_name} readOnly />
                  <Field label="E-Mail" name="owner_email_display" defaultValue={owner.email} readOnly />
                  <Field label="Telefonnummer" name="owner_phone_display" defaultValue={owner.phone} readOnly />
                  <Field label="Rolle" name="owner_role_display" defaultValue={owner.role ?? "inhaber"} readOnly />
                  <Field label="Kürzel" name="owner_staff_code_display" defaultValue={owner.staff_code} readOnly />
                </div>
              ) : (
                <EmptyValue />
              )
            ) : null}
          </motion.section>
        </AnimatePresence>

        <input name="active_tab" type="hidden" value={activeTab} />
      </form>
    </motion.section>
  );
}
