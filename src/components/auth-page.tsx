"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Play,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthMode = "login" | "register";
type BillingInterval = "monthly" | "quarterly" | "half_yearly" | "yearly";

type AuthPageProps = {
  initialMode?: AuthMode;
};

const privateDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "outlook.com",
  "hotmail.com",
  "live.de",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "t-online.de",
]);

const intervalLabels: Record<BillingInterval, string> = {
  monthly: "Monatlich · 89 €",
  quarterly: "3 Monate · 5 % Rabatt",
  half_yearly: "6 Monate · 10 % Rabatt",
  yearly: "12 Monate · 15 % Rabatt",
};

const intervalPlans: Record<BillingInterval, { months: number; discount: number }> = {
  monthly: { months: 1, discount: 0 },
  quarterly: { months: 3, discount: 5 },
  half_yearly: { months: 6, discount: 10 },
  yearly: { months: 12, discount: 15 },
};

function field(form: HTMLFormElement, name: string) {
  return new FormData(form).get(name)?.toString().trim() ?? "";
}

function isBusinessEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !privateDomains.has(domain);
}

function dashboardForRole(role?: string | null) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "pdl" || role === "inhaber" || role === "verwaltung") {
    return "/dashboard";
  }

  if (role === "mitarbeiter" || role === "pflegefachkraft") {
    return "/mitarbeiter/dashboard";
  }

  return "/dashboard";
}

function setAuthContextCookies(userId: string, companyId: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const options = `; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
  document.cookie = `nuria_user_id=${encodeURIComponent(userId)}${options}`;
  document.cookie = `nuria_company_id=${encodeURIComponent(companyId)}${options}`;
}

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (section: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-accordion-section">
      <button className="auth-section-trigger" onClick={() => onToggle(id)} type="button">
        <span>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.16 }}>
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <motion.div
        aria-hidden={!open}
        className="auth-section-content"
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        style={{ overflow: "hidden", pointerEvents: open ? "auto" : "none" }}
      >
        <div>{children}</div>
      </motion.div>
    </div>
  );
}

export function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [openSections, setOpenSections] = useState(["personal"]);

  const pricePreview = useMemo(
    () =>
      Object.entries(intervalPlans).map(([key, plan]) => ({
        key: key as BillingInterval,
        label: intervalLabels[key as BillingInterval],
        total: `${(89 * plan.months * (1 - plan.discount / 100)).toFixed(2).replace(".", ",")} €`,
      })),
    [],
  );

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoginLoading(true);

    const form = event.currentTarget;
    const email = field(form, "email");
    const password = field(form, "password");

    if (!email || !password) {
      setLoginLoading(false);
      setMessage({ type: "error", text: "Bitte E-Mail und Passwort eingeben." });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoginLoading(false);
      setMessage({ type: "error", text: "Login ist aktuell nicht verfügbar." });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoginLoading(false);
      setMessage({ type: "error", text: "Login fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten." });
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", data.user.id).maybeSingle();
    if (profile?.company_id) {
      setAuthContextCookies(data.user.id, profile.company_id);
    }
    window.location.assign(dashboardForRole(profile?.role));
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setRegisterLoading(true);

    const form = event.currentTarget;
    const email = field(form, "email");
    const password = field(form, "password");
    const passwordRepeat = field(form, "passwordRepeat");
    const postalCode = field(form, "postalCode");

    if (!isBusinessEmail(email)) {
      setRegisterLoading(false);
      setMessage({ type: "error", text: "Bitte verwenden Sie eine geschäftliche E-Mail-Adresse Ihres Pflegedienstes." });
      return;
    }

    if (password.length < 8) {
      setRegisterLoading(false);
      setMessage({ type: "error", text: "Das Passwort muss mindestens 8 Zeichen lang sein." });
      return;
    }

    if (password !== passwordRepeat) {
      setRegisterLoading(false);
      setMessage({ type: "error", text: "Passwort und Wiederholung stimmen nicht überein." });
      return;
    }

    if (!/^\d{4,5}$/.test(postalCode)) {
      setRegisterLoading(false);
      setMessage({ type: "error", text: "Bitte geben Sie eine plausible PLZ ein." });
      return;
    }

    const response = await fetch("/login/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;

    if (!response.ok || !result?.ok) {
      setRegisterLoading(false);
      setMessage({ type: "error", text: result?.message ?? "Registrierung fehlgeschlagen. Bitte prüfen Sie Ihre Angaben." });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setRegisterLoading(false);
      setMode("login");
      setMessage({ type: "success", text: "Registrierung erfolgreich. Bitte loggen Sie sich ein." });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setRegisterLoading(false);
      setMode("login");
      setMessage({ type: "success", text: "Registrierung erfolgreich. Bitte loggen Sie sich ein." });
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", data.user.id).maybeSingle();
    if (profile?.company_id) {
      setAuthContextCookies(data.user.id, profile.company_id);
    }

    window.location.assign("/dashboard/onboarding");
  }

  function toggleSection(section: string) {
    setOpenSections((current) => (current.includes(section) ? current.filter((item) => item !== section) : [...current, section]));
  }

  return (
    <main className="auth-page-shell">
      <motion.section className="auth-panel" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24 }}>
        <div className="auth-scroll">
          <div className="auth-card-shell">
            <div className="auth-tabs" role="tablist" aria-label="Anmeldung">
              <motion.span
                className="auth-tab-indicator"
                animate={{ x: mode === "login" ? "0%" : "100%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
              {(["login", "register"] as const).map((tab) => (
                <button className={mode === tab ? "active" : ""} key={tab} onClick={() => { setMode(tab); setMessage(null); }} type="button">
                  {tab === "login" ? "Login" : "Registrieren"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div className="auth-heading">
                  <h1>{mode === "login" ? "Einloggen" : "Pflegedienst registrieren"}</h1>
                  <p>
                    {mode === "login"
                      ? "Melden Sie sich bei Nuria Pflege an und nutzen Sie Ihre Pflege Software für digitale Pflegedienst Verwaltung."
                      : "Registrieren Sie Ihren ambulanten Pflegedienst für Pflege Software mit Dienstplanung, Tourenplanung, Zeiterfassung und Mitarbeiterverwaltung."}
                  </p>
                </div>

                <AnimatePresence>
                  {message ? (
                    <motion.div className={`auth-message ${message.type}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {message.text}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {mode === "login" ? (
                  <form className="auth-form" onSubmit={handleLogin}>
                    <label>
                      E-Mail
                      <span className="auth-input">
                        <Mail size={16} />
                        <input autoComplete="email" name="email" required type="email" />
                      </span>
                    </label>
                    <label>
                      Passwort
                      <span className="auth-input">
                        <LockKeyhole size={16} />
                        <input autoComplete="current-password" name="password" required type={showPassword ? "text" : "password"} />
                        <button aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"} onClick={() => setShowPassword((value) => !value)} type="button">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </span>
                    </label>
                    <motion.button className="button auth-submit" disabled={loginLoading} type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                      {loginLoading ? <Loader2 className="spin" size={16} /> : null}
                      Einloggen
                    </motion.button>
                  </form>
                ) : (
                  <form className="auth-form" onSubmit={handleRegister}>
                    <Section id="personal" title="Persönliche Daten" open={openSections.includes("personal")} onToggle={toggleSection}>
                      <div className="auth-grid">
                        <label>Vorname<input name="firstName" required /></label>
                        <label>Nachname<input name="lastName" required /></label>
                      </div>
                      <label>Geschäftliche E-Mail<input autoComplete="email" name="email" required type="email" /></label>
                      <div className="auth-grid">
                        <label>Passwort<input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
                        <label>Passwort wiederholen<input autoComplete="new-password" minLength={8} name="passwordRepeat" required type="password" /></label>
                      </div>
                    </Section>

                    <Section id="company" title="Pflegedienst" open={openSections.includes("company")} onToggle={toggleSection}>
                      <label>Pflegedienstname<input name="companyName" required /></label>
                      <div className="auth-grid">
                        <label>Rechtsform optional<input name="legalForm" /></label>
                        <label>Telefon<input name="phone" required type="tel" /></label>
                      </div>
                      <label>IK-Nummer optional<input name="ikNumber" /></label>
                    </Section>

                    <Section id="address" title="Adresse" open={openSections.includes("address")} onToggle={toggleSection}>
                      <div className="auth-grid">
                        <label>Straße<input name="street" required /></label>
                        <label>Hausnummer<input name="houseNumber" required /></label>
                      </div>
                      <div className="auth-grid">
                        <label>PLZ<input inputMode="numeric" name="postalCode" required /></label>
                        <label>Ort<input name="city" required /></label>
                      </div>
                      <div className="auth-grid">
                        <label>Bundesland optional<input name="state" /></label>
                        <label>Land<input defaultValue="Deutschland" name="country" required /></label>
                      </div>
                    </Section>

                    <Section id="tariff" title="Tarif" open={openSections.includes("tariff")} onToggle={toggleSection}>
                      <div className="billing-choice-grid">
                        {pricePreview.map((item) => (
                          <label className="billing-choice" key={item.key}>
                            <input defaultChecked={item.key === "monthly"} name="billingInterval" required type="radio" value={item.key} />
                            <span>{item.label}</span>
                            <strong>{item.total}</strong>
                          </label>
                        ))}
                      </div>
                    </Section>

                    <motion.button className="button auth-submit" disabled={registerLoading} type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                      {registerLoading ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
                      Registrieren
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      <motion.section className="auth-video-side" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, delay: 0.04 }}>
        <div className="auth-video-frame">
          <motion.div className="auth-video-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
            <div className="auth-preview-toolbar">
              <span />
              <span />
              <span />
            </div>
            <div className="video-play-mark"><Play size={22} fill="currentColor" /></div>
            <strong>Nuria Pflege Überblick</strong>
            <p>Digitale Organisation ambulanter Pflegedienste mit Rollen, Planung, Touren, Zeiten und interner Kommunikation.</p>
            <div className="auth-preview-metrics" aria-hidden>
              <span><UserRound size={15} /> Pflege</span>
              <span><Building2 size={15} /> Organisation</span>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
