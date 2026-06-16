"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckCircle2, Copy, CreditCard, ShieldCheck, UserCog, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import type { BillingInterval } from "@/lib/payment";
import type { OnboardingData } from "@/lib/onboarding";

type ActionResult = { ok: boolean; message?: string; purpose?: string };

type Actions = {
  saveCompany: (formData: FormData) => Promise<ActionResult>;
  saveLocation: (formData: FormData) => Promise<ActionResult>;
  selectPlan: (formData: FormData) => Promise<ActionResult>;
  confirmPayment: (formData: FormData) => Promise<ActionResult>;
};

const roles = [
  ["Inhaber", "Gesamtübersicht, Standorte, Mitarbeiter, Rollen, Einstellungen und Organisation.", Building2],
  ["PDL", "Planung, Touren, Klienten und operative Abläufe je Berechtigung.", ShieldCheck],
  ["Verwaltung", "Organisation, Dokumente, Kommunikation und administrative Aufgaben je Berechtigung.", UserCog],
  ["Mitarbeiter", "Eigener Dienstplan, eigene Tour, eigene Patienten, Zeiterfassung, Dokumente und interne Nachrichten.", Users],
] as const;

const steps = ["Willkommen", "Unternehmen", "Standort", "Rollen", "Tarif", "Zahlung", "Bestätigen"];

function money(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function planFromData(data: OnboardingData) {
  return data.plans.find((plan) => plan.packageId === data.company?.package_id) ?? data.plans.find((plan) => plan.billing_interval === data.company?.billing_interval) ?? data.plans[0];
}

function StepNav({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  return (
    <div className="onboarding-progress">
      {steps.map((label, index) => (
        <button className={step === index ? "active" : step > index ? "done" : ""} key={label} onClick={() => setStep(index)} type="button">
          <span>{index + 1}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="button secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      type="button"
    >
      <Copy size={16} />
      {copied ? "Kopiert" : "Verwendungszweck kopieren"}
    </button>
  );
}

export function OnboardingWizard({ data, actions }: { data: OnboardingData; actions: Actions }) {
  const router = useRouter();
  const initialPlan = useMemo(() => planFromData(data), [data]);
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(initialPlan.billing_interval);
  const [purpose, setPurpose] = useState(data.bank.purpose);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPlan = data.plans.find((plan) => plan.billing_interval === selectedInterval) ?? initialPlan;
  const paymentAmount = data.paymentLog?.amount && data.company?.billing_interval === selectedPlan.billing_interval ? data.paymentLog.amount : selectedPlan.total;
  const paymentPurpose = purpose || data.bank.purpose;

  function submit(nextStep: number, action: (formData: FormData) => Promise<ActionResult>) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setSuccess(null);
      const formData = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const result = await action(formData);
          if (!result.ok) {
            setMessage(result.message ?? "Die Daten konnten nicht gespeichert werden.");
            return;
          }
          if (result.purpose) setPurpose(result.purpose);
          setStep(nextStep);
          router.refresh();
        } catch {
          setMessage("Die Daten konnten nicht gespeichert werden.");
        }
      });
    };
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    formData.set("billing_interval", selectedPlan.billing_interval);
    startTransition(async () => {
      try {
        const result = await actions.confirmPayment(formData);
        if (!result.ok) {
          setMessage(result.message ?? "Zahlung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.");
          return;
        }
        setSuccess("Zahlung bestätigt. Ihr Zugang ist vorläufig aktiv.");
        router.refresh();
        router.replace("/dashboard");
      } catch {
        setMessage("Zahlung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.");
      }
    });
  }

  return (
    <motion.section className="onboarding-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="onboarding-shell">
        <div className="onboarding-header">
          <div>
            <span>Einrichtung noch nicht abgeschlossen</span>
            <h1>Nuria Pflege einrichten</h1>
            <p>Schließen Sie die Einrichtung ab und bestätigen Sie die Zahlung, um Nuria Pflege vollständig zu nutzen.</p>
          </div>
          <strong>{step + 1} / {steps.length}</strong>
        </div>

        <StepNav step={step} setStep={setStep} />

        {message ? <div className="onboarding-alert error">{message}</div> : null}
        {success ? <div className="onboarding-alert success">{success}</div> : null}

        <AnimatePresence mode="wait">
          <motion.div className="onboarding-panel" key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {step === 0 ? (
              <div className="onboarding-welcome">
                <CheckCircle2 size={38} />
                <h2>Willkommen bei Nuria Pflege</h2>
                <p>Wir führen Sie kurz durch die Einrichtung Ihres Pflegedienstes. Danach wählen Sie Ihren Tarif und bestätigen die Zahlung.</p>
                <button className="button" onClick={() => setStep(1)} type="button">Einrichtung starten</button>
              </div>
            ) : null}

            {step === 1 ? (
              <form className="onboarding-form" onSubmit={submit(2, actions.saveCompany)}>
                <h2>Unternehmensdaten prüfen</h2>
                <label>Name des Pflegedienstes<input name="name" required defaultValue={data.company?.name ?? ""} /></label>
                <label>Inhaber Vorname<input name="first_name" required defaultValue={data.owner?.first_name ?? ""} /></label>
                <label>Inhaber Nachname<input name="last_name" required defaultValue={data.owner?.last_name ?? ""} /></label>
                <label>Geschäftliche E-Mail<input name="email" required type="email" defaultValue={data.owner?.email ?? data.company?.email ?? ""} /></label>
                <label>Telefonnummer<input name="phone" required defaultValue={data.company?.phone ?? ""} /></label>
                <label>Straße<input name="street" required defaultValue={data.company?.street ?? ""} /></label>
                <label>Hausnummer<input name="house_number" required defaultValue={data.company?.house_number ?? ""} /></label>
                <label>PLZ<input name="postal_code" required defaultValue={data.company?.postal_code ?? ""} /></label>
                <label>Ort<input name="city" required defaultValue={data.company?.city ?? ""} /></label>
                <label>IK-Nummer optional<input name="ik_number" defaultValue={data.company?.ik_number ?? ""} /></label>
                <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(0)} type="button">Zurück</button><button className="button" disabled={isPending}>{isPending ? "Speichert..." : "Speichern und weiter"}</button></div>
              </form>
            ) : null}

            {step === 2 ? (
              <form className="onboarding-form" onSubmit={submit(3, actions.saveLocation)}>
                <h2>Hauptstandort prüfen</h2>
                {data.primaryLocation?.id ? <input name="id" type="hidden" value={data.primaryLocation.id} /> : null}
                <label>Standortname<input name="name" required defaultValue={data.primaryLocation?.name ?? data.company?.name ?? "Hauptstandort"} /></label>
                <label>Straße<input name="street" required defaultValue={data.primaryLocation?.street ?? data.company?.street ?? ""} /></label>
                <label>Hausnummer<input name="house_number" required defaultValue={data.primaryLocation?.house_number ?? data.company?.house_number ?? ""} /></label>
                <label>PLZ<input name="postal_code" required defaultValue={data.primaryLocation?.postal_code ?? data.company?.postal_code ?? ""} /></label>
                <label>Ort<input name="city" required defaultValue={data.primaryLocation?.city ?? data.company?.city ?? ""} /></label>
                <label>Telefonnummer<input name="phone" required defaultValue={data.primaryLocation?.phone ?? data.company?.phone ?? ""} /></label>
                <label>Ansprechpartner optional<input name="contact_person" defaultValue={data.primaryLocation?.contact_person ?? ""} /></label>
                <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(1)} type="button">Zurück</button><button className="button" disabled={isPending}>{isPending ? "Speichert..." : "Standort speichern und weiter"}</button></div>
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
              <form className="onboarding-step" onSubmit={submit(5, actions.selectPlan)}>
                <h2>Tarif auswählen</h2>
                <p>Wählen Sie die Laufzeit für den Nuria Pflege Starttarif.</p>
                <div className="onboarding-plan-grid">
                  {data.plans.map((plan) => (
                    <label className={selectedPlan.packageId === plan.packageId ? "active" : ""} key={plan.packageId}>
                      <input checked={selectedPlan.packageId === plan.packageId} name="billing_interval" required type="radio" value={plan.billing_interval} onChange={() => setSelectedInterval(plan.billing_interval)} />
                      <span>{plan.label}</span>
                      <strong>{money(plan.total)}</strong>
                      <small>{plan.discount ? `${plan.discount} % Rabatt` : "89,00 € / Monat"}</small>
                      <em>{plan.packageId}</em>
                    </label>
                  ))}
                </div>
                <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(3)} type="button">Zurück</button><button className="button" disabled={isPending}>{isPending ? "Speichert..." : "Tarif auswählen und weiter"}</button></div>
              </form>
            ) : null}

            {step === 5 ? (
              <div className="onboarding-step">
                <h2>Zahlungsübersicht</h2>
                <div className="onboarding-payment-grid">
                  <div><span>Ausgewählter Tarif</span><strong>{selectedPlan.packageId}</strong></div>
                  <div><span>Laufzeit</span><strong>{selectedPlan.label}</strong></div>
                  <div><span>Betrag</span><strong>{money(paymentAmount)}</strong></div>
                  <div><span>Rabatt</span><strong>{selectedPlan.discount ? `${selectedPlan.discount} %` : "Kein Rabatt"}</strong></div>
                  <div><span>Empfänger</span><strong>{data.bank.recipient}</strong></div>
                  <div><span>IBAN</span><strong>{data.bank.iban}</strong></div>
                  <div><span>BIC</span><strong>{data.bank.bic}</strong></div>
                  <div><span>Bank</span><strong>{data.bank.bank}</strong></div>
                  <div className="wide"><span>Verwendungszweck</span><strong>{paymentPurpose}</strong><CopyButton value={paymentPurpose} /></div>
                </div>
                <div className="onboarding-info">Bitte klicken Sie nur auf „Zahlung bestätigen“, wenn Sie die Zahlung für den ausgewählten Tarif bereits vorgenommen haben. Nach Ihrer Bestätigung wird Ihr Zugang vorläufig freigeschaltet. Wir erwarten den Zahlungseingang innerhalb von 5 Tagen. Sollte innerhalb dieser Frist kein Zahlungseingang festgestellt werden, wird Ihr Nutzerkonto vorübergehend eingeschränkt und Sie erhalten einen Hinweis zur offenen Zahlung.</div>
                <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(4)} type="button">Zurück</button><button className="button" onClick={() => setStep(6)} type="button">Weiter zur Bestätigung</button></div>
              </div>
            ) : null}

            {step === 6 ? (
              <form className="onboarding-step" onSubmit={confirm}>
                <CreditCard size={28} />
                <h2>Zahlung bestätigen</h2>
                <div className="onboarding-payment-summary">
                  <span>{selectedPlan.packageId}</span>
                  <strong>{money(paymentAmount)}</strong>
                  <small>{paymentPurpose}</small>
                </div>
                <div className="onboarding-info">Bitte klicken Sie nur auf „Zahlung bestätigen“, wenn Sie die Zahlung für den ausgewählten Tarif bereits vorgenommen haben. Nach Ihrer Bestätigung wird Ihr Zugang vorläufig freigeschaltet. Wir erwarten den Zahlungseingang innerhalb von 5 Tagen. Sollte innerhalb dieser Frist kein Zahlungseingang festgestellt werden, wird Ihr Nutzerkonto vorübergehend eingeschränkt und Sie erhalten einen Hinweis zur offenen Zahlung.</div>
                <label className="onboarding-confirm"><input checked={checked} name="payment_confirmed" onChange={(event) => setChecked(event.target.checked)} type="checkbox" />Ich bestätige, dass ich die Zahlung für den ausgewählten Tarif vorgenommen habe.</label>
                <div className="onboarding-actions"><button className="button secondary" onClick={() => setStep(5)} type="button">Zurück</button><button className="button" disabled={!checked || isPending}>{isPending ? "Bestätigt..." : "Zahlung bestätigen"}</button></div>
              </form>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
