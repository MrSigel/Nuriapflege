"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  BadgeEuro,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Cookie,
  FileText,
  FolderOpen,
  Globe,
  LayoutGrid,
  LockKeyhole,
  LogIn,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Route,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  ScrollText,
  UserCog,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type PublicPage = "home" | "features" | "pricing" | "contact" | "imprint" | "privacy" | "terms" | "cookies" | "withdrawal" | "dpa" | "tom" | "legal";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};

const motionViewport = { once: true, amount: 0.2 };
const cardHover = { y: -5, scale: 1.01 };

const modules = [
  ["Dienstplanung", "Dienste strukturiert planen und Einsätze klar koordinieren.", CalendarDays],
  ["Tourenplanung", "Tourenplanung Pflege für einen geordneten Tagesablauf vorbereiten.", Route],
  ["Mitarbeiter-Dashboard", "Mitarbeiter sehen eigene Dienste, Touren und relevante Aufgaben.", Users],
  ["Klientenübersicht", "Klienteninformationen zentral verwalten und je Berechtigung zugänglich machen.", UserRound],
  ["Zeiterfassung", "Arbeitszeiten digital erfassen und nachvollziehbar strukturieren.", Clock3],
  ["Dokumente hochladen", "Dokumente intern ablegen, ohne sie öffentlich darzustellen.", FolderOpen],
  ["Notizen & Übergaben", "Übergaben und interne Hinweise zentral sammeln.", FileText],
  ["Kommunikation", "Interne Nachrichten für Teams und einzelne Mitarbeiter bündeln.", MessagesSquare],
  ["Abwesenheiten / Urlaub", "Urlaub, Krankheit und Abwesenheiten im Mitarbeiterbereich abbilden.", CalendarOff],
  ["Rollen & Rechte", "Zugriffe über Rollen und Berechtigungen strukturieren.", ShieldCheck],
  ["Standorte", "Mehrere Standorte innerhalb eines Pflegedienstes organisieren.", Building2],
  ["Einstellungen", "Grunddaten und organisatorische Einstellungen verwalten.", Settings],
] as const;

const heroPoints = [
  ["Rollenbasierte Ansichten", ShieldCheck],
  ["Dienstplanung & Touren", Route],
  ["Zeiterfassung & Dokumente", Clock3],
  ["Interne Kommunikation", MessageCircle],
] as const;

const explainCards = [
  ["Planen", "Dienstplanung und Touren strukturiert vorbereiten.", ClipboardList],
  ["Organisieren", "Mitarbeiter, Rollen, Standorte und Abläufe bündeln.", Building2],
  ["Dokumentieren", "Dokumente, Zeiten und Übergaben zentral erfassen.", FileText],
] as const;

const problems = [
  ["Verteilte Dienstpläne", "Dienstpläne liegen an mehreren Stellen.", CalendarDays],
  ["Manuelle Tourenabstimmung", "Touren werden im Alltag häufig separat koordiniert.", MapPin],
  ["Nachgetragene Zeiten", "Zeiten müssen später nachvollziehbar ergänzt werden.", Clock3],
  ["Verteilte Dokumente", "Dokumente und Verordnungen gehen im Alltag unter.", FolderOpen],
  ["Unklare Übergaben", "Übergaben sind nicht zentral gesammelt.", MessageCircle],
  ["Mobile Übersicht", "Mitarbeiter benötigen unterwegs eine klare Ansicht.", UserCog],
] as const;

const roles = [
  ["Inhaber", "Gesamtübersicht, Mitarbeiter, Standorte, Rollen, Einstellungen und Organisation.", Building2],
  ["PDL", "Planung, Touren, Klienten, Mitarbeiterkoordination und operative Abläufe je Berechtigung.", ClipboardList],
  ["Verwaltung", "Organisation, Dokumente, Kommunikation und administrative Aufgaben je Berechtigung.", FolderOpen],
  ["Mitarbeiter", "Eigener Dienstplan, eigene Tour, eigene Patienten, Zeiterfassung, Dokumente und interne Nachrichten.", UserRound],
] as const;

const security = [
  ["Rollenbasierte Ansichten", Shield],
  ["Mandantentrennung pro Pflegedienst", Building2],
  ["Mitarbeiter sehen nur eigene oder zugewiesene Inhalte", UserCog],
  ["Dokumente werden nicht öffentlich dargestellt", LockKeyhole],
  ["Interne Bereiche sind geschützt", ShieldCheck],
] as const;

const faqs = [
  [
    "Für wen ist Nuria Pflege gedacht?",
    "Für ambulante Pflegedienste, die Dienstplanung, Touren, Mitarbeiterorganisation, Dokumente, Zeiterfassung und interne Kommunikation digital bündeln möchten.",
  ],
  ["Welche Rollen gibt es im System?", "Inhaber, PDL, Verwaltung und Mitarbeiter. Die sichtbaren Bereiche richten sich nach Rolle und Berechtigung."],
  [
    "Sehen Mitarbeiter alle Patientendaten?",
    "Nein. Mitarbeiter sehen nur eigene oder zugewiesene Inhalte, z. B. eigene Touren, Dienste oder freigegebene Patienteninformationen.",
  ],
  ["Kann ich Mitarbeiter einladen?", "Ja. Mitarbeiter können angelegt oder eingeladen und passenden Rollen zugeordnet werden."],
  ["Gibt es Tarifdetails?", "Ja. Die Tarifdetails sind über den Tarifbereich und im Registrierungsprozess einsehbar."],
  ["Ist Nuria Pflege eine Jobbörse?", "Nein. Nuria Pflege ist eine Software zur digitalen Organisation ambulanter Pflegedienste."],
  [
    "Kann ich Nuria Pflege mobil nutzen?",
    "Die Oberfläche soll auch auf mobilen Geräten nutzbar sein, besonders für Mitarbeiterbereiche wie Tour, Dienstplan, Dokumente und Zeiterfassung.",
  ],
] as const;

const featureModules = [
  ["Dienstplanung", "Dienste planen, Einsätze strukturieren und Mitarbeiter übersichtlich einteilen.", CalendarDays],
  ["Tourenplanung", "Touren vorbereiten, Stopps strukturieren und Mitarbeitern ihre eigene Touransicht bereitstellen.", Route],
  ["Mitarbeiter-Dashboard", "Mitarbeiter sehen eigene Dienste, Touren, zugewiesene Patienten, Zeiten und interne Nachrichten.", Users],
  ["Klientenübersicht", "Klienten strukturiert verwalten und relevante Informationen rollenbasiert zugänglich machen.", UserRound],
  ["Zeiterfassung", "Arbeitszeiten, Tourzeiten und Einsatzzeiten nachvollziehbar erfassen.", Clock3],
  ["Dokumente", "Dokumente und Verordnungen geschützt zu passenden Klienten oder Einsätzen ablegen.", FileText],
  ["Notizen & Übergaben", "Hinweise, Beobachtungen und Übergaben zentral erfassen und intern sichtbar machen.", MessageSquareText],
  ["Kommunikation", "Interne Nachrichten für Teams, Touren, Übergaben und organisatorische Rückfragen.", MessagesSquare],
  ["Abwesenheiten / Urlaub", "Urlaub, Krankheit und Abwesenheiten strukturiert beantragen und verwalten.", CalendarOff],
  ["Rollen & Rechte", "Zugriffe nach Rolle und Berechtigung steuern - für Inhaber, PDL, Verwaltung und Mitarbeiter.", ShieldCheck],
  ["Standorte", "Mehrere Standorte innerhalb eines Pflegedienstes strukturiert organisieren.", Building2],
  ["Einstellungen", "Grunddaten, Benutzerbereiche und organisatorische Einstellungen zentral verwalten.", Settings],
] as const;

const roleDetails = [
  ["Inhaber", "Gesamtübersicht, Standorte, Mitarbeiter, Rollen, Tarif und zentrale Einstellungen.", Building2],
  ["PDL", "Dienstplanung, Touren, Klienten, Zeiten und operative Abstimmung je Berechtigung.", ClipboardList],
  ["Verwaltung", "Dokumente, Kommunikation, Organisation und administrative Arbeitsbereiche.", FolderOpen],
  ["Mitarbeiter", "Eigene Dienste, eigene Touren, zugewiesene Inhalte, Zeiten und interne Nachrichten.", UserRound],
] as const;

const pricingFeatures = [
  "Inhaber-Dashboard",
  "PDL- und Verwaltungsbereiche",
  "Mitarbeiter-Dashboard",
  "Dienstplanung",
  "Tourenplanung",
  "Klientenübersicht",
  "Zeiterfassung",
  "Dokumente",
  "Notizen & Übergaben",
  "Kommunikation",
  "Abwesenheiten / Urlaub",
  "Rollen & Rechte",
  "Standorte",
] as const;

const pricingIntervals = [
  ["Monatlich", "89,00 €", "monatliche Laufzeit"],
  ["3 Monate", "253,65 €", "mit 5 % Rabatt"],
  ["6 Monate", "480,60 €", "mit 10 % Rabatt"],
  ["12 Monate", "907,80 €", "mit 15 % Rabatt"],
] as const;

const pricingFaqs = [
  ["Wo sehe ich die genauen Zahlungsdetails?", "Im Registrierungs- und Tarifbereich nach der Anmeldung."],
  ["Kann ich zwischen Laufzeiten wählen?", "Ja, es stehen monatliche, 3-monatige, 6-monatige und jährliche Laufzeiten zur Verfügung."],
  ["Gibt es verschiedene Pakete?", "Zum Start gibt es einen klaren Starttarif. Weitere Pakete können später ergänzt werden."],
  ["Kann ich Mitarbeiter einladen?", "Ja, Mitarbeiter können nach Aktivierung angelegt oder eingeladen werden."],
] as const;

const contactCards = [
  ["Betreiber", "Enrico Gross", "", UserRound],
  ["Standort", "Castrop-Rauxel, Deutschland", "", MapPin],
  ["Website", "www.nuria-pflege.de", "http://www.nuria-pflege.de", Globe],
] as const;

const contactHelp = [
  ["Fragen zur Registrierung", UserPlus],
  ["Fragen zur Einrichtung des Pflegedienstes", Settings],
  ["Fragen zu Rollen und Benutzerzugängen", ShieldCheck],
  ["Fragen zu Tarifdetails", BadgeEuro],
  ["Allgemeine Rückfragen zu Nuria Pflege", Mail],
] as const;

function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="public-nav">
      <Link className="public-brand" href="/">
        <motion.img
          src="/logo_transparent.png"
          alt="Nuria Pflege"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
      </Link>
      <button className="public-menu-button" onClick={() => setOpen((current) => !current)} type="button">
        Menü
      </button>
      <nav className={open ? "open" : ""} aria-label="Öffentliche Navigation">
        <Link href="/funktionen" onClick={() => setOpen(false)}>Funktionen</Link>
        <Link href="/tarifdetails" onClick={() => setOpen(false)}>Tarifdetails</Link>
        <Link href="/kontakt" onClick={() => setOpen(false)}>Kontakt</Link>
      </nav>
      <Link className="public-nav-cta" href="/login">
        Anmelden
      </Link>
    </header>
  );
}

function PublicFooter() {
  const footerGroups = [
    {
      title: "Navigation",
      links: [
        ["Funktionen", "/funktionen", LayoutGrid],
        ["Tarifdetails", "/tarifdetails", BadgeEuro],
        ["Kontakt", "/kontakt", Mail],
      ],
    },
    {
      title: "Zugang",
      links: [
        ["Login", "/login", LogIn],
        ["Registrieren", "/registrieren", UserPlus],
      ],
    },
    {
      title: "Rechtliches",
      links: [
        ["Rechtliches", "/rechtliches", ScrollText],
        ["Impressum", "/impressum", Scale],
        ["Datenschutz", "/datenschutz", ShieldCheck],
        ["AGB", "/agb", FileText],
        ["Cookie-Einstellungen", "/cookie-einstellungen", Cookie],
        ["Widerruf", "/widerruf", FileText],
        ["Auftragsverarbeitung", "/av-vertrag", Shield],
        ["TOM", "/tom", LockKeyhole],
      ],
    },
  ] as const;

  return (
    <motion.footer
      className="public-footer"
      initial="hidden"
      variants={staggerContainer}
      viewport={motionViewport}
      whileInView="visible"
    >
      <motion.div className="public-footer-brand" variants={fadeUp}>
        <div className="public-footer-brand-copy">
          <motion.img
            alt="Nuria Pflege"
            src="/logo_transparent.png"
            transition={{ duration: 0.24 }}
            whileHover={{ scale: 1.03 }}
          />
          <p>Digitale Pflege-Software für ambulante Pflegedienste zur strukturierten Organisation des Pflegealltags.</p>
        </div>
      </motion.div>

      <motion.div className="public-footer-links" variants={staggerContainer}>
        {footerGroups.map(({ title, links }) => (
          <motion.div className="public-footer-column" key={title} variants={fadeUp}>
            <span className="public-footer-title">{title}</span>
            {links.map(([label, href, Icon]) => (
              <motion.div key={href} whileHover={{ x: 4 }} transition={{ duration: 0.16 }}>
                <Link href={href}><Icon size={16} />{label}</Link>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="public-footer-bottom" variants={fadeUp}>
        <span>© 2026 Nuria Pflege. Alle Rechte vorbehalten.</span>
      </motion.div>
    </motion.footer>
  );
}

const cookieConsentName = "nuria_cookie_consent";
const cookieMaxAge = 60 * 60 * 24 * 180;

function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(!document.cookie.split("; ").some((cookie) => cookie.startsWith(`${cookieConsentName}=`)));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function saveConsent(value: "accepted" | "rejected" | "necessary") {
    document.cookie = `${cookieConsentName}=${value}; Max-Age=${cookieMaxAge}; Path=/; SameSite=Lax`;
    setSettingsOpen(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div className="cookie-consent" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.22 }}>
        <div className="cookie-consent-copy">
          <span>Cookie-Einstellungen</span>
          <p>Nuria Pflege verwendet aktuell nur technisch notwendige Cookies und Speichermechanismen für Betrieb, Sicherheit, Anmeldung und die Speicherung dieser Auswahl.</p>
          {settingsOpen ? (
            <div className="cookie-consent-settings">
              <label>
                <input checked disabled type="checkbox" />
                Technisch notwendige Cookies
              </label>
              <small>Erforderlich für Website-Betrieb, Anmeldung, Session-Verwaltung und Cookie-Auswahl.</small>
            </div>
          ) : null}
        </div>
        <div className="cookie-consent-actions">
          <button type="button" onClick={() => saveConsent("accepted")}>Akzeptieren</button>
          <button type="button" onClick={() => saveConsent("rejected")}>Ablehnen</button>
          {settingsOpen ? (
            <button type="button" onClick={() => saveConsent("necessary")}>Auswahl speichern</button>
          ) : (
            <button type="button" onClick={() => setSettingsOpen(true)}>Einstellen</button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Hero() {
  return (
    <section className="public-hero">
      <motion.div animate="visible" className="public-hero-copy" initial="hidden" variants={staggerContainer}>
        <motion.div className="hero-orbit-mark" variants={fadeUp} aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <motion.span
              animate={{ opacity: [0.28, 1, 0.28], scale: [1, 1.12, 1], y: [0, -3, 0] }}
              key={index}
              transition={{ delay: index * 0.18, duration: 1.6, ease: "easeInOut", repeat: Infinity }}
            />
          ))}
        </motion.div>
        <motion.h1 variants={fadeUp}>Mehr Übersicht im <span>Pflege</span>alltag</motion.h1>
        <motion.p variants={fadeUp}>
          Nuria Pflege ist die digitale Arbeitsfläche für ambulante Pflegedienste: Dienstplanung, Touren,
          Mitarbeiterorganisation, Dokumente, Zeiterfassung und interne Kommunikation an einem Ort.
        </motion.p>
        <motion.div className="public-actions" variants={fadeUp}>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link className="public-button" href="/registrieren">Pflegedienst registrieren</Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link className="public-button secondary" href="/funktionen">Arbeitsbereiche ansehen</Link>
          </motion.div>
        </motion.div>
        <motion.div className="public-hero-points" variants={staggerContainer}>
          {heroPoints.map(([label, Icon]) => (
            <motion.div className="public-pill" key={label} variants={fadeUp} whileHover={{ scale: 1.02 }}>
              <Icon size={16} />
              <span>{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function HomeSections() {
  return (
    <>
      <Hero />
      <ExplainSection />
      <ProblemSection />
      <FeaturesSection />
      <RolesSection />
      <SecuritySection />
      <PricingSection />
      <ProcessSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}

function ExplainSection() {
  return (
    <motion.section className="public-section public-explain" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading center" variants={fadeUp}>
        <h2>Eine Plattform für den Pflegealltag.</h2>
        <p>Nuria Pflege unterstützt Pflegedienste dabei, interne Abläufe digital zu bündeln – von der Planung bis zur täglichen Mitarbeiteransicht.</p>
      </motion.div>
      <div className="public-mini-grid">
        {explainCards.map(([title, text, Icon]) => (
          <motion.article className="public-mini-card" key={title} variants={fadeUp} whileHover={cardHover}>
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function ProblemSection() {
  return (
    <motion.section className="public-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading" variants={fadeUp}>
        <h2>Typische Aufgaben im Alltag.</h2>
      </motion.div>
      <div className="public-problem-grid">
        {problems.map(([title, text, Icon]) => (
          <motion.article className="public-problem-card" key={title} variants={fadeUp} whileHover={cardHover}>
            <Icon size={21} />
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function FeaturesSection() {
  return (
    <motion.section className="public-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading" variants={fadeUp}>
        <h2>Wichtige Bereiche an einem Ort.</h2>
      </motion.div>
      <div className="public-card-grid">
        {modules.map(([title, text, Icon]) => (
          <motion.article className="public-card" key={title} variants={fadeUp} whileHover={cardHover}>
            <span className="public-icon-badge"><Icon size={21} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function RolesSection() {
  return (
    <motion.section className="public-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading" variants={fadeUp}>
        <h2>Für verschiedene Rollen im Pflegedienst.</h2>
      </motion.div>
      <div className="public-role-grid">
        {roles.map(([title, text, Icon]) => (
          <motion.article className="public-role-card" key={title} variants={fadeUp} whileHover={cardHover}>
            <span className="public-role-line" />
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function SecuritySection() {
  return (
    <motion.section className="public-section public-security" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading" variants={fadeUp}>
        <h2>Zugriffe klar geregelt.</h2>
        <p>Interne Bereiche sind auf Rollen, Pflegedienste und zugewiesene Inhalte ausgerichtet.</p>
      </motion.div>
      <div className="public-security-grid">
        {security.map(([item, Icon]) => (
          <motion.div className="public-security-card" key={item} variants={fadeUp} whileHover={{ y: -3 }}>
            <Icon size={20} />
            <span>{item}</span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function PricingSection() {
  return (
    <motion.section className="public-section public-pricing" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading" variants={fadeUp}>
        <h2>Tarifdetails</h2>
        <p>Nuria Pflege startet mit einem klaren Tarifmodell für ambulante Pflegedienste. Die Details werden transparent im Registrierungsprozess und im Tarifbereich angezeigt.</p>
      </motion.div>
      <motion.div className="public-price-card" variants={fadeUp} whileHover={cardHover}>
        <p className="price-title">Starttarif: 89 € / Monat</p>
        <span>3 Monate: 5 % Rabatt</span>
        <span>6 Monate: 10 % Rabatt</span>
        <span>12 Monate: 15 % Rabatt</span>
        <Link className="public-button secondary" href="/tarifdetails">Tarifdetails ansehen</Link>
      </motion.div>
    </motion.section>
  );
}

function ProcessSection() {
  const steps = [
    ["Pflegedienst registrieren", UserPlus],
    ["Tarif auswählen", CheckCircle2],
    ["Zugang einrichten", LockKeyhole],
    ["Mitarbeiter und Rollen anlegen", Users],
    ["Pflegealltag digital organisieren", ClipboardList],
  ] as const;

  return (
    <motion.section className="public-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading" variants={fadeUp}>
        <h2>So starten Pflegedienste mit Nuria Pflege.</h2>
      </motion.div>
      <div className="public-step-grid">
        {steps.map(([step, Icon], index) => (
          <motion.article className="public-step" key={step} variants={fadeUp} whileHover={cardHover}>
            <span>{index + 1}</span>
            <Icon size={21} />
            <strong>{step}</strong>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <motion.section className="public-section public-faq" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.div className="public-section-heading center" variants={fadeUp}>
        <h2>Häufige Fragen</h2>
      </motion.div>
      <motion.div className="public-faq-list" variants={staggerContainer}>
        {faqs.map(([question, answer], index) => {
          const active = open === index;
          return (
            <motion.article className="public-faq-item" key={question} variants={fadeUp}>
              <button onClick={() => setOpen(active ? -1 : index)} type="button">
                <span>{question}</span>
                <motion.span animate={{ rotate: active ? 180 : 0 }} transition={{ duration: 0.18 }}>
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {active ? (
                  <motion.div animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p>{answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

function FinalCta() {
  return (
    <motion.section className="public-cta" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.h2 variants={fadeUp}>Starten Sie mit einer klaren digitalen Struktur für Ihren Pflegedienst.</motion.h2>
      <motion.p variants={fadeUp}>Registrieren Sie Ihren Pflegedienst und richten Sie Schritt für Schritt Mitarbeiter, Rollen und zentrale Arbeitsbereiche ein.</motion.p>
      <motion.div className="public-actions" variants={fadeUp}>
        <Link className="public-button" href="/registrieren">Jetzt registrieren</Link>
        <Link className="public-button secondary" href="/kontakt">Kontakt aufnehmen</Link>
      </motion.div>
    </motion.section>
  );
}

function SubHeroVisual({ items }: { items: readonly [string, React.ComponentType<{ size?: number }>][] }) {
  return (
    <motion.div className="public-subhero-visual" variants={fadeUp}>
      {items.map(([label, Icon]) => (
        <motion.div className="public-subhero-chip" key={label} whileHover={{ y: -3 }}>
          <Icon size={18} />
          <span>{label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PublicPageCta({ headline, text, primaryHref, primaryLabel, secondaryHref, secondaryLabel }: { headline: string; text?: string; primaryHref: string; primaryLabel: string; secondaryHref: string; secondaryLabel: string }) {
  return (
    <motion.section className="public-cta public-page-cta" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
      <motion.h2 variants={fadeUp}>{headline}</motion.h2>
      {text ? <motion.p variants={fadeUp}>{text}</motion.p> : null}
      <motion.div className="public-actions" variants={fadeUp}>
        <Link className="public-button" href={primaryHref}>{primaryLabel}</Link>
        <Link className="public-button secondary" href={secondaryHref}>{secondaryLabel}</Link>
      </motion.div>
    </motion.section>
  );
}

function FeaturesPageContent() {
  return (
    <>
      <PublicSubPage
        actions={[
          ["Jetzt registrieren", "/registrieren", "primary"],
          ["Tarifdetails ansehen", "/tarifdetails", "secondary"],
        ]}
        badge="Funktionen"
        intro="Nuria Pflege bündelt zentrale Arbeitsbereiche ambulanter Pflegedienste - von Dienstplanung und Touren bis zu Dokumenten, Zeiterfassung und interner Kommunikation."
        title="Alles Wichtige für den Pflegealltag an einem Ort."
        visual={<SubHeroVisual items={[["Planung", CalendarDays], ["Touren", Route], ["Team", Users], ["Dokumente", FileText]]} />}
      />
      <motion.section className="public-section public-detail-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.div className="public-section-heading center" variants={fadeUp}>
          <h2>Zentrale Module für den Alltag.</h2>
          <p>Die Bereiche greifen strukturiert ineinander und bleiben nach Rolle und Zuständigkeit übersichtlich nutzbar.</p>
        </motion.div>
        <div className="public-feature-detail-grid">
          {featureModules.map(([title, text, Icon]) => (
            <motion.article className="public-detail-card" key={title} variants={fadeUp} whileHover={cardHover}>
              <span className="public-icon-badge"><Icon size={21} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
      <motion.section className="public-section public-role-detail-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.div className="public-section-heading center" variants={fadeUp}>
          <h2>Rollenbasiert aufgebaut</h2>
          <p>Mitarbeiter sehen eigene oder zugewiesene Inhalte. Inhaber, PDL und Verwaltung arbeiten in den jeweils relevanten Bereichen.</p>
        </motion.div>
        <div className="public-role-grid">
          {roleDetails.map(([title, text, Icon]) => (
            <motion.article className="public-role-card" key={title} variants={fadeUp} whileHover={cardHover}>
              <span className="public-role-line" />
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
      <PublicPageCta
        headline="Bereit für mehr Struktur im Pflegealltag?"
        primaryHref="/registrieren"
        primaryLabel="Jetzt registrieren"
        secondaryHref="/kontakt"
        secondaryLabel="Kontakt aufnehmen"
        text="Registrieren Sie Ihren Pflegedienst und richten Sie Nuria Pflege Schritt für Schritt ein."
      />
    </>
  );
}

function PricingPageContent() {
  return (
    <>
      <PublicSubPage
        actions={[
          ["Jetzt registrieren", "/registrieren", "primary"],
          ["Kontakt aufnehmen", "/kontakt", "secondary"],
        ]}
        badge="Tarifdetails"
        intro="Nuria Pflege startet mit einem übersichtlichen Tarif für Pflegedienste, der zentrale Bereiche der digitalen Organisation bündelt."
        title="Ein klares Tarifmodell für ambulante Pflegedienste."
        visual={<SubHeroVisual items={[["89 € / Monat", BadgeEuro], ["Laufzeiten", CalendarDays], ["Rollen", ShieldCheck], ["Zugang", LockKeyhole]]} />}
      />
      <motion.section className="public-section public-tariff-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.article className="public-tariff-card" variants={fadeUp} whileHover={cardHover}>
          <div>
            <span className="public-eyebrow">Starttarif</span>
            <h2>Nuria Pflege Starttarif</h2>
            <p className="public-tariff-price">89 € / Monat</p>
            <p>Für ambulante Pflegedienste, die Dienstplanung, Touren, Mitarbeiterorganisation, Dokumente, Zeiterfassung und interne Kommunikation digital bündeln möchten.</p>
            <Link className="public-button" href="/registrieren">Jetzt registrieren</Link>
          </div>
          <div className="public-price-includes">
            {pricingFeatures.map((item) => (
              <span key={item}><CheckCircle2 size={16} />{item}</span>
            ))}
          </div>
        </motion.article>
      </motion.section>
      <motion.section className="public-section public-detail-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.div className="public-section-heading center" variants={fadeUp}>
          <h2>Laufzeitoptionen</h2>
        </motion.div>
        <div className="public-interval-grid">
          {pricingIntervals.map(([title, price, detail]) => (
            <motion.article className="public-interval-card" key={title} variants={fadeUp} whileHover={cardHover}>
              <span>{title}</span>
              <strong>{price}</strong>
              <p>{detail}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
      <motion.section className="public-section public-info-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.article className="public-note-card" variants={fadeUp}>
          <BadgeEuro size={22} />
          <div>
            <h2>Transparent vorbereitet</h2>
            <p>Die Tarifauswahl und Zahlungsdetails werden im Registrierungsprozess angezeigt. Nach der Einrichtung kann die Zahlung bestätigt und der Zugang entsprechend dem gewählten Tarif genutzt werden.</p>
          </div>
        </motion.article>
        <div className="public-security-grid public-transparent-grid">
          {["klare Tarifauswahl im Registrierungsprozess", "keine unnötigen Zusatzmodule im Starttarif", "Rollenbasierte Nutzung für verschiedene Bereiche", "Tarifdetails jederzeit nachvollziehbar"].map((item) => (
            <motion.div className="public-security-card" key={item} variants={fadeUp} whileHover={{ y: -3 }}>
              <CheckCircle2 size={20} />
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>
      <motion.section className="public-section public-faq" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.div className="public-section-heading center" variants={fadeUp}>
          <h2>Häufige Fragen zum Tarif</h2>
        </motion.div>
        <div className="public-faq-list">
          {pricingFaqs.map(([question, answer]) => (
            <motion.article className="public-faq-item public-static-faq" key={question} variants={fadeUp}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
      <PublicPageCta
        headline="Starten Sie mit einem klaren Tarifmodell."
        primaryHref="/registrieren"
        primaryLabel="Jetzt registrieren"
        secondaryHref="/kontakt"
        secondaryLabel="Kontakt aufnehmen"
      />
    </>
  );
}

function ContactPageContent() {
  return (
    <>
      <PublicSubPage
        badge="Kontakt"
        intro="Haben Sie Fragen zur Nutzung, Registrierung oder Einrichtung? Kontaktieren Sie uns gerne direkt."
        title="Kontakt zu Nuria Pflege."
        visual={<SubHeroVisual items={[["E-Mail", Mail], ["Betreiber", UserRound], ["Standort", MapPin], ["Website", Globe]]} />}
      />
      <motion.section className="public-section public-contact-cta" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.a className="public-button" href="mailto:kontakt@nuria-pflege.de" variants={fadeUp} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          E-Mail schreiben
        </motion.a>
      </motion.section>
      <motion.section className="public-section public-contact-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <div className="public-contact-grid">
          {contactCards.map(([title, value, href, Icon]) => (
            <motion.article className="public-detail-card public-contact-card" key={title} variants={fadeUp} whileHover={cardHover}>
              <span className="public-icon-badge"><Icon size={21} /></span>
              <h3>{title}</h3>
              {href ? <a href={href}>{value}</a> : <p>{value}</p>}
            </motion.article>
          ))}
        </div>
      </motion.section>
      <motion.section className="public-section public-detail-section" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.div className="public-section-heading center" variants={fadeUp}>
          <h2>Wobei wir helfen können</h2>
        </motion.div>
        <div className="public-help-grid">
          {contactHelp.map(([item, Icon]) => (
            <motion.div className="public-help-item" key={item} variants={fadeUp} whileHover={{ y: -3 }}>
              <Icon size={18} />
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>
      <motion.section className="public-section public-legal-note" initial="hidden" variants={staggerContainer} viewport={motionViewport} whileInView="visible">
        <motion.article className="public-note-card" variants={fadeUp}>
          <Scale size={22} />
          <div>
            <h2>Rechtliche Informationen</h2>
            <p>Rechtliche Informationen finden Sie im Impressum, in der Datenschutzerklärung und in den AGB.</p>
            <div className="public-legal-links">
              <Link href="/impressum">Impressum</Link>
              <Link href="/datenschutz">Datenschutz</Link>
              <Link href="/agb">AGB</Link>
            </div>
          </div>
        </motion.article>
      </motion.section>
      <PublicPageCta
        headline="Möchten Sie Nuria Pflege einrichten?"
        primaryHref="/registrieren"
        primaryLabel="Jetzt registrieren"
        secondaryHref="/tarifdetails"
        secondaryLabel="Tarifdetails ansehen"
      />
    </>
  );
}

type LegalPageKey = Exclude<PublicPage, "home" | "features" | "pricing" | "contact">;

type LegalSection = {
  id: string;
  title: string;
  body?: string[];
  list?: string[];
  link?: { href: string; label: string };
};

const operatorLines = ["Nuria Pflege", "Enrico Gross", "Einzelunternehmen", "Gerther Straße 76", "44577 Castrop-Rauxel", "Deutschland"];

const legalPages: Record<Exclude<LegalPageKey, "legal">, { title: string; intro: string; sections: LegalSection[] }> = {
  imprint: {
    title: "Impressum",
    intro: "Anbieterkennzeichnung für Nuria Pflege nach aktueller deutscher Rechtslage.",
    sections: [
      { id: "anbieter", title: "Angaben nach § 5 DDG", list: operatorLines },
      { id: "kontakt", title: "Kontakt", link: { href: "mailto:kontakt@nuria-pflege.de", label: "E-Mail schreiben" } },
      { id: "ustid", title: "Umsatzsteuer-ID", body: ["Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: DE278597389."] },
      { id: "mstv", title: "Verantwortlich nach § 18 Abs. 2 MStV", body: ["Verantwortlich für journalistisch-redaktionelle Inhalte, soweit solche Inhalte angeboten werden: Enrico Gross, Gerther Straße 76, 44577 Castrop-Rauxel, Deutschland."] },
      { id: "streitschlichtung", title: "Streitbeilegung", body: ["Nuria Pflege ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."] },
    ],
  },
  privacy: {
    title: "Datenschutzerklärung",
    intro: "Informationen zur Verarbeitung personenbezogener Daten bei Nuria Pflege nach DSGVO und deutschem Datenschutzrecht.",
    sections: [
      { id: "verantwortlicher", title: "1. Verantwortlicher", body: ["Verantwortlich für diese Website und die Bereitstellung von Nuria Pflege ist Enrico Gross, Nuria Pflege, Gerther Straße 76, 44577 Castrop-Rauxel, Deutschland. Kontakt: kontakt@nuria-pflege.de."] },
      { id: "datenschutzbeauftragter", title: "2. Datenschutzbeauftragter", body: ["Datenschutzbeauftragter und Ansprechpartner für Datenschutzanfragen: Enrico Gross, Nuria Pflege, Gerther Straße 76, 44577 Castrop-Rauxel, Deutschland. Kontakt: kontakt@nuria-pflege.de."] },
      { id: "grundlagen", title: "3. Zwecke und Rechtsgrundlagen", body: ["Personenbezogene Daten werden verarbeitet, soweit dies zur Bereitstellung der Website, zur Registrierung, zur Nutzung geschützter Softwarebereiche, zur Bearbeitung von Anfragen, zur Vertragsanbahnung, zur Vertragserfüllung, zur Erfüllung rechtlicher Pflichten oder zur Wahrung berechtigter Interessen erforderlich ist. Als Rechtsgrundlagen kommen insbesondere Art. 6 Abs. 1 lit. b DSGVO, Art. 6 Abs. 1 lit. c DSGVO, Art. 6 Abs. 1 lit. f DSGVO und, sofern eine Einwilligung eingeholt wird, Art. 6 Abs. 1 lit. a DSGVO in Betracht."] },
      { id: "hosting", title: "4. Hosting und technische Infrastruktur", body: ["Nuria Pflege wird technisch über Vercel und Supabase bereitgestellt. Dabei können technische Server- und Logdaten verarbeitet werden, etwa IP-Adresse, Zeitpunkt des Zugriffs, angeforderte Ressourcen, Browser- und Geräteinformationen sowie technische Fehlerdaten, um Website und Anwendung auszuliefern, Sicherheit zu unterstützen, Störungen zu analysieren und den Betrieb zu ermöglichen.", "Vercel veröffentlicht Informationen zu Datenschutz, Sicherheit und internationalen Datentransfers. Diese Informationen werden bei der datenschutzrechtlichen Einordnung berücksichtigt."] },
      { id: "supabase", title: "5. Supabase", body: ["Supabase wird für Authentifizierung, Datenbankfunktionen und anwendungsbezogene Speicherung eingesetzt. Die Supabase-Projektregion ist die EU-Region. Dazu können Benutzerkonten, Unternehmensdaten, Rollen, Rechte, Klientendaten, Mitarbeiterdaten, Dokumente, interne Kommunikation, Zeiterfassung, Abwesenheiten, Standorte, Notizen, Übergaben und technische Verarbeitungsdaten gehören.", "Supabase veröffentlicht Informationen zu Datenschutz, Sicherheit und Transfermechanismen. Diese Informationen werden bei der datenschutzrechtlichen Einordnung berücksichtigt."] },
      { id: "konto", title: "6. Registrierung und Benutzerkonto", body: ["Bei der Registrierung eines Pflegedienstes werden Unternehmensdaten, Inhaber-Konto, Login-Daten, Tarif- und Zahlungsstatus sowie rollen- und rechtebezogene Informationen verarbeitet. Mitarbeiterkonten können durch berechtigte Nutzer angelegt oder eingeladen werden."] },
      { id: "mandanten", title: "7. Pflegeunternehmen und Mandantentrennung", body: ["Daten werden organisations- und mandantenbezogen verarbeitet. Jeder Pflegedienst arbeitet in einem eigenen Organisationsbereich. Zugriffe richten sich nach Rollen, Berechtigungen und Zuweisungen; Mitarbeiter sehen nur eigene oder zugewiesene Inhalte."] },
      { id: "klienten", title: "8. Klienten- und Patientendaten", body: ["Pflegedienste können Klienten- und Patientendaten im System verarbeiten, um interne Organisation, Dienstplanung, Touren, Dokumentenablage, Notizen, Übergaben und Kommunikation zu unterstützen. Diese Daten werden nicht öffentlich dargestellt und können je nach Eingabe besondere Kategorien personenbezogener Daten im Sinne von Art. 9 DSGVO betreffen. Für die rechtmäßige Eingabe und Nutzung solcher Daten bleibt der jeweilige Pflegedienst verantwortlich."] },
      { id: "dokumente", title: "9. Dokumente und Uploads", body: ["Dokumente können in geschützten internen Bereichen hochgeladen und Klienten, Einsätzen, Touren oder weiteren organisatorischen Vorgängen zugeordnet werden. Der Zugriff erfolgt rollen- und berechtigungsbezogen."] },
      { id: "kommunikation", title: "10. Interne Kommunikation", body: ["Nuria Pflege kann Nachrichten, Konversationen, Teilnehmerinformationen, Ankündigungen und Nachrichteninhalte zwischen berechtigten Benutzern speichern und verarbeiten."] },
      { id: "planung", title: "11. Zeiterfassung, Dienstplanung und Tourenplanung", body: ["Zur Organisation des Pflegealltags können Dienst- und Einsatzdaten, Touren, Arbeitszeiten, Statusinformationen, Abwesenheiten, Urlaube und organisatorische Notizen verarbeitet werden."] },
      { id: "kontakt", title: "12. Kontaktaufnahme", body: ["Bei Kontaktaufnahme können Name, E-Mail-Adresse, Unternehmen, Telefonnummer und Nachricht verarbeitet werden, um die Anfrage zu bearbeiten und zu beantworten."] },
      { id: "cookies", title: "13. Cookies und lokale Speicherung", body: ["Aktuell verwendet Nuria Pflege nur technisch notwendige Cookies und vergleichbare Speichermechanismen, die für Betrieb, Sicherheit, Anmeldung, Session-Verwaltung und die Speicherung der Cookie-Auswahl erforderlich sind. Grundlage für den Zugriff auf Endeinrichtungen ist bei technisch notwendigen Vorgängen § 25 Abs. 2 TDDDG. Werden später Tracking- oder Marketingtools eingebunden, ist hierfür eine gesonderte Einwilligungslösung erforderlich."], list: ["nuria_cookie_consent: speichert die Cookie-Auswahl, Speicherdauer bis zu 6 Monate.", "sb-<project-ref>-auth-token: Supabase-Authentifizierungsspeicher für angemeldete Benutzer, Speicherdauer abhängig von Sitzung, Token-Laufzeit oder Logout.", "technische Server- und Sicherheitslogs bei Vercel/Supabase: dienen Betrieb, Sicherheit und Fehleranalyse."] },
      { id: "google", title: "14. Google Search Console und Google Business", body: ["Google Search Console kann zur technischen Auswertung der Auffindbarkeit der Website genutzt werden und setzt hierfür keinen Cookie-Banner für Website-Besucher voraus. Google Business ist nur relevant, soweit externe Google-Angebote tatsächlich verlinkt oder eingebunden werden."] },
      { id: "empfaenger", title: "15. Empfänger und Auftragsverarbeiter", body: ["Als technische Dienstleister werden Vercel Inc. für Hosting, Auslieferung und technische Plattformdienste sowie Supabase Inc. für Datenbank, Authentifizierung, Storage und technische Backend-Dienste eingesetzt. Weitere Empfänger oder Auftragsverarbeiter werden nur berücksichtigt, soweit sie tatsächlich genutzt werden."] },
      { id: "drittland", title: "16. Drittlandbezug", body: ["Die Supabase-Projektregion ist die EU-Region. Je nach eingesetzter technischer Infrastruktur, Support-, Sicherheits- oder Betriebsprozessen kann eine Verarbeitung außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums dennoch nicht vollständig ausgeschlossen werden. In solchen Fällen sind geeignete Garantien nach DSGVO zu berücksichtigen."] },
      { id: "dauer", title: "17. Speicherdauer", body: ["Daten werden gespeichert, solange dies für die jeweiligen Zwecke erforderlich ist, ein Nutzungs- oder Vertragsverhältnis besteht, gesetzliche Aufbewahrungsfristen gelten oder berechtigte Interessen bestehen. Löschanfragen können an kontakt@nuria-pflege.de gerichtet werden."] },
      { id: "rechte", title: "18. Rechte betroffener Personen", list: ["Auskunft nach Art. 15 DSGVO", "Berichtigung nach Art. 16 DSGVO", "Löschung nach Art. 17 DSGVO", "Einschränkung der Verarbeitung nach Art. 18 DSGVO", "Datenübertragbarkeit nach Art. 20 DSGVO", "Widerspruch nach Art. 21 DSGVO", "Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft", "Beschwerde bei einer zuständigen Datenschutzaufsichtsbehörde"] },
      { id: "sicherheit", title: "19. Sicherheit", body: ["Nuria Pflege nutzt rollenbasierte Zugriffe, Mandantentrennung, Zugriffsbeschränkungen und technische sowie organisatorische Maßnahmen, um Daten im Rahmen der Anwendung geschützt zu verarbeiten. Eine absolute Sicherheit kann bei internetbasierten Diensten nicht zugesichert werden."] },
    ],
  },
  terms: {
    title: "Allgemeine Geschäftsbedingungen",
    intro: "Nutzungsbedingungen für Nuria Pflege als Software-as-a-Service-Angebot für ambulante Pflegedienste.",
    sections: [
      { id: "geltung", title: "1. Geltungsbereich", body: ["Diese Bedingungen gelten für die Nutzung von Nuria Pflege durch Pflegedienste, Unternehmen und sonstige Unternehmer im Sinne von § 14 BGB. Das Angebot richtet sich nicht an Verbraucher im Sinne von § 13 BGB."] },
      { id: "gegenstand", title: "2. Vertragsgegenstand", body: ["Nuria Pflege ist eine digitale Softwareplattform zur internen Organisation ambulanter Pflegedienste, insbesondere für Dienstplanung, Tourenplanung, Mitarbeiterorganisation, Klientenverwaltung, Dokumentenablage, Zeiterfassung, interne Kommunikation, Notizen, Übergaben, Abwesenheiten, Rollen, Rechte und Standorte."] },
      { id: "registrierung", title: "3. Registrierung und Nutzerkonto", body: ["Die Registrierung erfolgt durch einen berechtigten Inhaber oder eine entsprechend verantwortliche Person. Unternehmensdaten, Benutzerkonten, Rollen, Berechtigungen und Tarifinformationen sind richtig und aktuell zu halten."] },
      { id: "nutzung", title: "4. Nutzung der Software", body: ["Die Nutzung erfolgt nach Rolle und Berechtigung. Nuria Pflege ersetzt keine medizinische Beratung und keine rechtliche Beratung und garantiert keine bestimmten medizinischen, organisatorischen oder rechtlichen Ergebnisse. Eine missbräuchliche oder rechtswidrige Nutzung ist untersagt."] },
      { id: "tarife", title: "5. Tarife und Zahlung", body: ["Der Starttarif beträgt 89 € monatlich. Laufzeitoptionen können mit 5 % Rabatt für 3 Monate, 10 % Rabatt für 6 Monate oder 15 % Rabatt für 12 Monate gewählt werden. Zahlungen erfolgen per Banküberweisung über den internen Tarif- und Zahlungsbereich."] },
      { id: "aktivierung", title: "6. Aktivierung und Zahlungsbestätigung", body: ["Der Kunde kann bestätigen, dass eine Zahlung vorgenommen wurde. Der Zugang kann daraufhin vorläufig freigeschaltet werden. Der Zahlungseingang wird geprüft und innerhalb von 5 Kalendertagen erwartet. Bei ausbleibender Zahlung kann der Zugang eingeschränkt oder gesperrt werden."] },
      { id: "pflichten", title: "7. Pflichten des Kunden", list: ["rechtmäßige Nutzung der Software", "eigene Verantwortung für eingegebene Daten", "Schutz von Zugangsdaten", "korrekte Verwaltung von Mitarbeiterzugängen", "Einladung nur berechtigter Personen", "Beachtung datenschutzrechtlicher Pflichten bei Klienten-, Patienten- und Mitarbeiterdaten"] },
      { id: "datenschutz", title: "8. Datenschutz und Auftragsverarbeitung", body: ["Die Nutzung kann die Verarbeitung personenbezogener Daten beinhalten. Soweit Nuria Pflege Daten im Auftrag des Kunden verarbeitet, wird ein AV-Vertrag nach Art. 28 DSGVO bereitgestellt. Der Kunde bleibt für die rechtmäßige Eingabe, Pflege und Nutzung der Daten verantwortlich."] },
      { id: "verfuegbarkeit", title: "9. Verfügbarkeit", body: ["Nuria Pflege wird als internetbasierte Software bereitgestellt. Wartungen, technische Einschränkungen oder Störungen können auftreten und werden möglichst zeitnah bearbeitet. Eine ununterbrochene Verfügbarkeit wird nicht zugesichert."] },
      { id: "haftung", title: "10. Haftung", body: ["Die Haftung richtet sich nach den gesetzlichen Bestimmungen. Für vom Kunden eingegebene Inhalte, deren Richtigkeit, deren rechtmäßige Nutzung und die fachliche Bewertung im Pflegebetrieb ist der Kunde verantwortlich."] },
      { id: "laufzeit", title: "11. Laufzeit und Kündigung", body: ["Die Laufzeit richtet sich nach der gewählten Tarif- oder Laufzeitoption. Monatliche Laufzeiten können zum Ende des laufenden Abrechnungsmonats gekündigt werden. Laufzeiten über 3, 6 oder 12 Monate können zum Ende der gebuchten Laufzeit gekündigt werden. Die Kündigung kann in Textform per E-Mail an kontakt@nuria-pflege.de erfolgen."] },
      { id: "verlaengerung", title: "12. Verlängerung", body: ["Sofern keine Kündigung zum Ende der laufenden Laufzeit erfolgt, kann der Zugang für die gleiche oder eine im Tarifbereich gewählte neue Laufzeit fortgeführt werden. Eine automatische Abbuchung findet nicht statt, solange Zahlung per Banküberweisung vorgesehen ist."] },
      { id: "leistungen", title: "13. Änderungen der Leistungen", body: ["Nuria Pflege kann funktional weiterentwickelt werden. Wesentliche Änderungen, die die Nutzung erheblich betreffen, werden angemessen kommuniziert."] },
      { id: "schluss", title: "14. Schlussbestimmungen", body: ["Es gilt deutsches Recht, soweit rechtlich zulässig. Gerichtsstandvereinbarungen gelten nur, soweit gesetzlich zulässig. Sollte eine Regelung unwirksam sein, bleiben die übrigen Regelungen unberührt."] },
    ],
  },
  cookies: {
    title: "Cookie-Einstellungen",
    intro: "Informationen zu technisch notwendigen Cookies bei Nuria Pflege.",
    sections: [
      { id: "stand", title: "Aktueller Stand", body: ["Aktuell verwendet Nuria Pflege nur technisch notwendige Cookies und vergleichbare Speichermechanismen, die für Betrieb, Sicherheit, Anmeldung und Cookie-Auswahl erforderlich sind."] },
      { id: "notwendig", title: "Technisch notwendige Cookies", body: ["Diese Cookies und vergleichbaren Speichermechanismen dienen der sicheren Bereitstellung der Website, der Anmeldung, der Session-Verwaltung, der Speicherung der Cookie-Auswahl und dem Schutz interner Bereiche. Technisch notwendige Speicherungen können nach § 25 Abs. 2 TDDDG ohne gesonderte Einwilligung zulässig sein, wenn sie für den ausdrücklich gewünschten digitalen Dienst erforderlich sind."], list: ["nuria_cookie_consent: speichert die Auswahl im Cookie-Banner, Speicherdauer bis zu 6 Monate.", "sb-<project-ref>-auth-token: Supabase-Authentifizierungsspeicher für angemeldete Benutzer, Speicherdauer abhängig von Sitzung, Token-Laufzeit oder Logout.", "technische Server- und Sicherheitslogs bei Vercel/Supabase: Betrieb, Sicherheit und Fehleranalyse."] },
      { id: "keine-werbung", title: "Keine Werbe- oder Tracking-Cookies", body: ["Es werden keine Google-Analytics-, Meta-Pixel-, TikTok-Pixel- oder vergleichbaren Marketing-Cookies gesetzt, solange solche Dienste nicht aktiv eingebunden sind."] },
      { id: "dauer", title: "Speicherdauer", body: ["Die Speicherdauer richtet sich nach dem jeweiligen technischen Zweck, insbesondere nach der Dauer einer Sitzung, nach sicherheitsbezogenen Anforderungen oder nach technisch notwendigen Anmeldefunktionen."] },
      { id: "aenderungen", title: "Änderungen", body: ["Wenn später Analyse-, Marketing- oder externe Trackingdienste eingebunden werden, muss diese Seite angepasst und eine passende Einwilligungslösung umgesetzt werden."] },
    ],
  },
  withdrawal: {
    title: "Widerruf",
    intro: "Hinweise zum Widerruf bei einer B2B-Softwareleistung.",
    sections: [
      { id: "ausrichtung", title: "Angebot für Unternehmen", body: ["Nuria Pflege richtet sich an Pflegedienste, Unternehmen und sonstige Unternehmer im Sinne von § 14 BGB. Das Angebot ist nicht auf den Abschluss von Verbraucherverträgen mit Verbrauchern im Sinne von § 13 BGB ausgerichtet."] },
      { id: "verbraucher", title: "Verbraucherwiderrufsrecht", body: ["Das gesetzliche Widerrufsrecht nach §§ 312g, 355 BGB betrifft grundsätzlich Verbraucher bei außerhalb von Geschäftsräumen geschlossenen Verträgen und Fernabsatzverträgen. Bei Verträgen zwischen Unternehmern besteht ein solches gesetzliches Verbraucherwiderrufsrecht in der Regel nicht."] },
      { id: "regelungen", title: "Individuelle Regelungen", body: ["Abweichende oder ergänzende vertragliche Regelungen können im Einzelfall vereinbart werden. Gesetzliche Rechte, die unabhängig von einem Verbraucherwiderrufsrecht bestehen, bleiben unberührt."] },
    ],
  },
  dpa: {
    title: "Auftragsverarbeitung",
    intro: "Informationen zur Auftragsverarbeitung nach Art. 28 DSGVO.",
    sections: [
      { id: "einordnung", title: "Auftragsverarbeitung", body: ["Nuria Pflege kann personenbezogene Daten im Auftrag des jeweiligen Pflegedienstes verarbeiten, soweit der Pflegedienst Daten in der Software erfasst und verwaltet."] },
      { id: "av", title: "AV-Vertrag", body: ["Für diese Verarbeitung wird ein AV-Vertrag nach Art. 28 DSGVO bereitgestellt. Der AV-Vertrag regelt insbesondere Gegenstand und Dauer der Verarbeitung, Art und Zweck der Verarbeitung, Arten personenbezogener Daten, Kategorien betroffener Personen, Weisungen, Vertraulichkeit, technische und organisatorische Maßnahmen, Unterauftragsverarbeiter, Unterstützungspflichten sowie Rückgabe oder Löschung von Daten."], link: { href: "mailto:kontakt@nuria-pflege.de?subject=AV-Vertrag%20Nuria%20Pflege", label: "AV-Vertrag anfragen" } },
      { id: "unterauftrag", title: "Unterauftragsverarbeiter", list: ["Vercel Inc.: Hosting, Auslieferung, Plattformbetrieb, technische Logs und Sicherheitsfunktionen.", "Supabase Inc.: Datenbank, Authentifizierung, Storage und technische Backend-Dienste."] },
      { id: "transfer", title: "Internationale Übermittlungen", body: ["Die Supabase-Projektregion ist die EU-Region. Je nach technischer Infrastruktur, Support-, Sicherheits- oder Betriebsprozessen können internationale Übermittlungen dennoch nicht vollständig ausgeschlossen werden. In solchen Fällen sind geeignete Garantien nach DSGVO zu berücksichtigen."] },
      { id: "verantwortung", title: "Verantwortlichkeiten", body: ["Der Pflegedienst bleibt Verantwortlicher für die rechtmäßige Eingabe, Pflege und Nutzung personenbezogener Daten in seinem Organisationsbereich. Nuria Pflege unterstützt die technische Verarbeitung im Rahmen der bereitgestellten Anwendung und verarbeitet Daten nach Maßgabe des AV-Vertrags."] },
      { id: "besondere-daten", title: "Besondere Kategorien personenbezogener Daten", body: ["Soweit Pflegedienste Gesundheitsdaten oder vergleichbar sensible Daten in Nuria Pflege eintragen, betrifft dies besondere Kategorien personenbezogener Daten. Die Zulässigkeit der Verarbeitung und die hierfür erforderlichen Rechtsgrundlagen sind vom jeweiligen Pflegedienst zu prüfen und sicherzustellen."] },
    ],
  },
  tom: {
    title: "Technische und organisatorische Maßnahmen",
    intro: "Übersicht vorbereiteter Maßnahmen zum Schutz der Verarbeitung.",
    sections: [
      { id: "zugriff", title: "Zugriffskontrolle und Authentifizierung", body: ["Zugriffe erfolgen über Benutzerkonten, Authentifizierung und rollenbasierte Berechtigungen."] },
      { id: "rollen", title: "Benutzerrollen und Datenzugriff", body: ["Inhaber, PDL, Verwaltung und Mitarbeiter erhalten unterschiedliche Ansichten und Berechtigungen. Mitarbeiter sehen nur eigene oder zugewiesene Inhalte."] },
      { id: "mandanten", title: "Mandantentrennung", body: ["Pflegedienste arbeiten in getrennten Organisationsbereichen. Daten werden mandantenbezogen strukturiert."] },
      { id: "dokumente", title: "Dokumentenzugriff", body: ["Dokumente und Uploads werden internen Bereichen zugeordnet und rollenbezogen zugänglich gemacht."] },
      { id: "hosting", title: "Hosting und Infrastruktur", body: ["Die technische Bereitstellung erfolgt über Vercel und Supabase. Die Supabase-Projektregion ist die EU-Region. Diese Dienste stellen Infrastruktur für Auslieferung, Datenbank, Authentifizierung, Storage, technische Speicherung, Sicherheitsfunktionen und Fehleranalyse bereit."] },
      { id: "protokolle", title: "Protokollierung und Nachvollziehbarkeit", body: ["Soweit im System vorhanden, können Aktivitätsprotokolle und technische Protokolldaten zur Nachvollziehbarkeit, Fehleranalyse, Sicherheit und Verwaltung eingesetzt werden."] },
      { id: "verfuegbarkeit", title: "Sicherung und Verfügbarkeit", body: ["Sicherungs-, Wiederherstellungs- und Verfügbarkeitsmaßnahmen richten sich nach der eingesetzten technischen Infrastruktur und den dort verfügbaren Funktionen. Eine absolute Verfügbarkeit wird nicht zugesichert."] },
      { id: "loeschung", title: "Löschung und Export", body: ["Soweit Funktionen vorhanden sind, können Daten exportiert oder gelöscht werden. Organisatorische Löschprozesse sind vom jeweiligen Pflegedienst im Rahmen seiner Verantwortlichkeit festzulegen."] },
      { id: "dokumentation", title: "Dokumentation", body: ["Die technischen und organisatorischen Maßnahmen werden dokumentiert und im Rahmen der rechtlichen Vorbereitung geprüft."] },
    ],
  },
};

const legalOverviewCards = [
  ["Impressum", "/impressum", Scale, "Betreiberangaben und Kontakt."],
  ["Datenschutz", "/datenschutz", ShieldCheck, "Informationen zur Datenverarbeitung."],
  ["AGB", "/agb", FileText, "Nutzungsbedingungen für die Software."],
  ["Cookie-Einstellungen", "/cookie-einstellungen", Cookie, "Technisch notwendige Cookies."],
  ["Widerruf", "/widerruf", FileText, "Hinweise zur B2B-Ausrichtung."],
  ["Auftragsverarbeitung", "/av-vertrag", Shield, "Informationen zum AV-Vertrag."],
  ["TOM", "/tom", LockKeyhole, "Technische und organisatorische Maßnahmen."],
] as const;

function LegalPage({ page }: { page: LegalPageKey }) {
  // Rechtliche Inhalte vor Veröffentlichung über eRecht24 final prüfen lassen.
  if (page === "legal") {
    return (
      <PublicSubPage className="public-legal-subpage" hideBadge intro="Zentrale Übersicht rechtlicher Informationen und vertrauensbildender Grundlagen." title="Rechtliches & Vertrauen">
        <section className="public-section public-legal-page">
          <div className="public-legal-card-grid">
            {legalOverviewCards.map(([title, href, Icon, text]) => (
              <article className="public-detail-card public-legal-card" key={href}>
                <span className="public-icon-badge"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href={href}>Seite öffnen</Link>
              </article>
            ))}
          </div>
          <article className="public-note-card public-trust-card">
            <ShieldCheck size={22} />
            <div>
              <h2>Vertrauensgrundlagen</h2>
              <ul>
                <li>Rollenbasierte Zugriffe</li>
                <li>Mandantentrennung pro Pflegedienst</li>
                <li>Geschützte interne Bereiche</li>
                <li>Keine öffentliche Darstellung von Patientendaten</li>
                <li>AV-Vertrag und TOM vorbereitet</li>
              </ul>
            </div>
          </article>
        </section>
      </PublicSubPage>
    );
  }

  const content = legalPages[page];

  return (
    <PublicSubPage className="public-legal-subpage" hideBadge intro={content.intro} title={content.title}>
      <section className="public-section public-legal-page">
        {content.sections.length > 3 ? (
          <nav className="public-legal-toc" aria-label="Abschnittsnavigation">
            {content.sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>{section.title}</a>
            ))}
          </nav>
        ) : null}
        <div className="public-legal-content">
          {content.sections.map((section) => (
            <article className="public-info-card public-legal-section" id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.body?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list ? (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.link ? <a className="public-button legal-link-button" href={section.link.href}>{section.link.label}</a> : null}
            </article>
          ))}
        </div>
      </section>
    </PublicSubPage>
  );
}

function PublicSubPage({ actions, badge = "Nuria Pflege", children, className, hideBadge = false, intro, title, visual }: { actions?: readonly [string, string, "primary" | "secondary"][]; badge?: string; children?: React.ReactNode; className?: string; hideBadge?: boolean; intro: string; title: string; visual?: React.ReactNode }) {
  return (
    <>
      <motion.section animate="visible" className={`public-subhero${className ? ` ${className}` : ""}`} initial="hidden" variants={staggerContainer}>
        <div className="public-subhero-copy">
          {hideBadge ? null : <motion.span className="public-eyebrow" variants={fadeUp}>{badge}</motion.span>}
          <motion.h1 variants={fadeUp}>{title}</motion.h1>
          <motion.p variants={fadeUp}>{intro}</motion.p>
          {actions ? (
            <motion.div className="public-actions" variants={fadeUp}>
              {actions.map(([label, href, variant]) => (
                <motion.div key={href} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  {href.startsWith("mailto:") ? (
                    <a className={`public-button ${variant === "secondary" ? "secondary" : ""}`} href={href}>{label}</a>
                  ) : (
                    <Link className={`public-button ${variant === "secondary" ? "secondary" : ""}`} href={href}>{label}</Link>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </div>
        {visual ? <div className="public-subhero-accent">{visual}</div> : null}
      </motion.section>
      {children}
    </>
  );
}

export function PublicSite({ page = "home" }: { page?: PublicPage }) {
  return (
    <div className="public-site">
      <PublicNav />
      <main>
        {page === "home" ? <HomeSections /> : null}
        {page === "features" ? <FeaturesPageContent /> : null}
        {page === "pricing" ? <PricingPageContent /> : null}
        {page === "contact" ? <ContactPageContent /> : null}
        {page === "imprint" || page === "privacy" || page === "terms" || page === "cookies" || page === "withdrawal" || page === "dpa" || page === "tom" || page === "legal" ? <LegalPage page={page} /> : null}
      </main>
      <PublicFooter />
      <CookieConsentBanner />
    </div>
  );
}
