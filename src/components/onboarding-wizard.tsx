"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckCircle2, CreditCard, MapPin, ShieldCheck, UserCog, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { OnboardingData } from "@/lib/onboarding";

type Actions = {
  saveCompany: (formData: FormData) => void;
  saveLocation: (formData: FormData) => void;
  selectPlan: (formData: FormData) => void;
  confirmPayment: (formData: FormData) => void;
};

const roles = [
  ["Inhaber", "Gesamtübersicht, Standorte, Mitarbeiter, Rollen, Einstellungen und Organisation.", Building2],
  ["PDL", "Planung, Touren, Klienten und operative Abläufe je Berechtigung.", ShieldCheck],
  ["Verwaltung", "Organisation, Dokumente, Kommunikation und administrative Aufgaben je Berechtigung.", UserCog],
  ["Mitarbeiter", "Eigener Dienstplan, eigene Tour, eigene Patienten, Zeiterfassung, Dokumente und interne Nachrichten.", Users],
] as const;

function money(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function StepNav({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const labels = ["Willkommen", "Unternehmen", "Standort", "Rollen", "Tarif", "Zahlung", "Bestätigen"];
  return (
    <div className="onboarding-progress">
      {labels.map((label, index) => (
        <button className={step === index ? "active" : step > index ? "done" : ""} key={label} onClick={() => setStep(index)} type="button">
          <span>{index + 1}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

export function OnboardingWizard({ data, actions }: { data: OnboardingData; actions: Actions }) {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState(false);
  const selectedPlan = useMemo(
    () => data.plans.find((plan) => plan.packageId === data.company?.package_id || plan.billing_interval === data.company?.billing_interval) ?? data.plans[0],
    [data.company?.billing_interval, data.company?.package_id, data.plans],
  );

  return (
    <motion.section className="onboarding-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="onboarding-header">
        <div>
          <h1>Einrichtung</h1>
          <p>Schließen Sie die Einrichtung ab und bestätigen Sie anschließend die Zahlung.</p>
        </div>
        <span>{step + 1} / 7</span>
      </div>
      <StepNav step={step} setStep={setStep} />

      <AnimatePresence mode="wait">
        <motion.div className="onboarding-panel" key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {step === 0 ? (
            <div className="onboarding-welcome">
              <CheckCircle2 size={34} />
              <h2>Willkommen bei Nuria Pflege</h2>
              <p>Wir führen Sie kurz durch die Einrichtung Ihres Pflegedienstes. Danach wählen Sie Ihren Tarif und bestätigen die Zahlung.</p>
              <button className="button" onClick={() => setStep(1)} type="button">Einrichtung starten</button>
            </div>
          ) : null}

          {step === 1 ? (
            <form action={actions.saveCompany} className="onboarding-form" onSubmit={() => setStep(2)}>
              <h2>Unternehmensdaten prüfen</h2>
              <label>Name des Pflegedienstes<input name="name" required defaultValue={data.company?.name ?? ""} /></label>
              <label>Inhaber Vorname<input name="first_name" required defaultValue={data.owner?.first_name ?? ""} /></label>
              <label>Inhaber Nachname<input name="last_name" required defaultValue={data.owner?.last_name ?? ""} /></label>
              <label>Geschäfts-E-Mail<input name="email" required type="email" defaultValue={data.owner?.email ?? data.company?.email ?? ""} /></label>
              <label>Telefonnummer<input name="phone" required defaultValue={data.company?.phone ?? ""} /></label>
              <label>Straße<input name="street" required defaultValue={data.company?.street ?? ""} /></label>
              <label>Hausnummer<input name="house_number" required defaultValue={data.company?.house_number ?? ""} /></label>
              <label>PLZ<input name="postal_code" required defaultValue={data.company?.postal_code ?? ""} /></label>
              <label>Ort<input name="city" required defaultValue={data.company?.city ?? ""} /></label>
              <label>IK-Nummer optional<input name="ik_number" defaultValue={data.company?.ik_number ?? ""} /></label>
              <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(0)} type="button">Zurück</button><button className="button">Speichern und weiter</button></div>
            </form>
          ) : null}

          {step === 2 ? (
            <form action={actions.saveLocation} className="onboarding-form" onSubmit={() => setStep(3)}>
              <h2>Hauptstandort prüfen</h2>
              {data.primaryLocation?.id ? <input name="id" type="hidden" value={data.primaryLocation.id} /> : null}
              <label>Standortname<input name="name" required defaultValue={data.primaryLocation?.name ?? data.company?.name ?? "Hauptstandort"} /></label>
              <label>Straße<input name="street" required defaultValue={data.primaryLocation?.street ?? data.company?.street ?? ""} /></label>
              <label>Hausnummer<input name="house_number" required defaultValue={data.primaryLocation?.house_number ?? data.company?.house_number ?? ""} /></label>
              <label>PLZ<input name="postal_code" required defaultValue={data.primaryLocation?.postal_code ?? data.company?.postal_code ?? ""} /></label>
              <label>Ort<input name="city" required defaultValue={data.primaryLocation?.city ?? data.company?.city ?? ""} /></label>
              <label>Telefonnummer<input name="phone" required defaultValue={data.primaryLocation?.phone ?? data.company?.phone ?? ""} /></label>
              <label>Ansprechpartner optional<input name="contact_person" defaultValue={data.primaryLocation?.contact_person ?? ""} /></label>
              <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(1)} type="button">Zurück</button><button className="button">Standort speichern und weiter</button></div>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="onboarding-step">
              <h2>Rollen im Pflegedienst</h2>
              <p>Nuria Pflege arbeitet mit klaren Rollen. Mitarbeiter können nach der Aktivierung eingeladen und passenden Rollen zugeordnet werden.</p>
              <div className="onboarding-role-grid">
                {roles.map(([title, text, Icon]) => <article key={title}><Icon size={20} /><h3>{title}</h3><p>{text}</p></article>)}
              </div>
              <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(2)} type="button">Zurück</button><button className="button" onClick={() => setStep(4)} type="button">Weiter</button></div>
            </div>
          ) : null}

          {step === 4 ? (
            <form action={actions.selectPlan} className="onboarding-step" onSubmit={() => setStep(5)}>
              <h2>Tarif auswählen</h2>
              <p>Starttarif: 89 € / Monat</p>
              <div className="onboarding-plan-grid">
                {data.plans.map((plan) => (
                  <label className={selectedPlan.packageId === plan.packageId ? "active" : ""} key={plan.packageId}>
                    <input defaultChecked={selectedPlan.packageId === plan.packageId} name="billing_interval" required type="radio" value={plan.billing_interval} />
                    <span>{plan.label}</span>
                    <strong>{money(plan.total)}</strong>
                    <small>{plan.discount ? `${plan.discount} % Rabatt` : "89 € / Monat"}</small>
                    <em>{plan.packageId}</em>
                  </label>
                ))}
              </div>
              <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(3)} type="button">Zurück</button><button className="button">Tarif auswählen und weiter</button></div>
            </form>
          ) : null}

          {step === 5 ? (
            <div className="onboarding-step">
              <h2>Zahlungsübersicht</h2>
              <div className="onboarding-payment-grid">
                <div><span>Ausgewählter Tarif</span><strong>{selectedPlan.label}</strong></div>
                <div><span>Laufzeit</span><strong>{selectedPlan.months} Monat{selectedPlan.months > 1 ? "e" : ""}</strong></div>
                <div><span>Betrag</span><strong>{money(data.paymentLog?.amount ?? selectedPlan.total)}</strong></div>
                <div><span>Rabatt</span><strong>{selectedPlan.discount ? `${selectedPlan.discount} %` : "Kein Rabatt"}</strong></div>
                <div><span>Empfänger</span><strong>{data.bank.recipient}</strong></div>
                <div><span>IBAN</span><strong>{data.bank.iban}</strong></div>
                <div><span>BIC</span><strong>{data.bank.bic}</strong></div>
                <div><span>Bank</span><strong>{data.bank.bank}</strong></div>
                <div className="wide"><span>Verwendungszweck</span><strong>{data.bank.purpose}</strong></div>
              </div>
              <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(4)} type="button">Zurück</button><button className="button" onClick={() => setStep(6)} type="button">Zahlung bestätigen</button></div>
            </div>
          ) : null}

          {step === 6 ? (
            <form action={actions.confirmPayment} className="onboarding-step">
              <CreditCard size={28} />
              <h2>Zahlung bestätigen</h2>
              <p>Bitte klicken Sie nur auf „Bestätigen“, wenn Sie die Zahlung für den ausgewählten Tarif bereits vorgenommen haben.</p>
              <div className="onboarding-info">Nach Ihrer Bestätigung wird Ihr Zugang für die Nutzung freigeschaltet. Wir erwarten den Zahlungseingang innerhalb von 5 Tagen. Sollte innerhalb dieser Frist kein Zahlungseingang festgestellt werden, wird Ihr Nutzerkonto vorübergehend gesperrt und Sie erhalten einen Hinweis zur offenen Zahlung.</div>
              <label className="onboarding-confirm"><input checked={checked} name="payment_confirmed" onChange={(event) => setChecked(event.target.checked)} type="checkbox" />Ich bestätige, dass ich die Zahlung für den ausgewählten Tarif vorgenommen habe.</label>
              <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(5)} type="button">Zurück</button><button className="button" disabled={!checked}>Bestätigen</button></div>
            </form>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}
