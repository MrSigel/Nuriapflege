"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  FolderOpen,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Route,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PublicPage = "home" | "features" | "pricing" | "contact" | "imprint" | "privacy" | "terms" | "cookies";

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

const previewModules = [
  ["Dienstplanung", "Strukturierte Einsatzübersicht", CalendarDays],
  ["Touren", "Geordnete Tagesplanung", Route],
  ["Dokumente", "Geschützte Ablage", FolderOpen],
  ["Kommunikation", "Interne Nachrichten", MessagesSquare],
] as const;

function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="public-nav">
      <Link className="public-brand" href="/">
        <img alt="Nuria Pflege" src="/logo_transparent.png" />
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
  return (
    <motion.footer
      className="public-footer"
      initial="hidden"
      variants={staggerContainer}
      viewport={motionViewport}
      whileInView="visible"
    >
      <motion.div variants={fadeUp}>
        <strong>Nuria Pflege</strong>
        <p>Digitale Pflege Software für ambulante Pflegedienste zur strukturierten Organisation des Pflegealltags.</p>
        <a href="mailto:kontakt@nuria-pflege.de">kontakt@nuria-pflege.de</a>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Link href="/funktionen">Funktionen</Link>
        <Link href="/tarifdetails">Tarifdetails</Link>
        <Link href="/kontakt">Kontakt</Link>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Link href="/login">Login</Link>
        <Link href="/registrieren">Registrieren</Link>
        <Link href="/cookie-einstellungen">Cookie-Einstellungen</Link>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/agb">AGB</Link>
      </motion.div>
    </motion.footer>
  );
}

function Hero() {
  return (
    <section className="public-hero">
      <motion.div animate="visible" className="public-hero-copy" initial="hidden" variants={staggerContainer}>
        <motion.h1 variants={fadeUp}>Mehr Übersicht im Pflegealltag</motion.h1>
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
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        aria-label="Neutrale Software-Vorschau"
        className="public-dashboard-preview"
        initial={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <motion.div className="preview-grid" initial="hidden" variants={staggerContainer} whileInView="visible" viewport={motionViewport}>
          {previewModules.map(([title, text, Icon]) => (
            <motion.div className="preview-tile" key={title} variants={fadeUp} whileHover={cardHover}>
              <Icon size={21} />
              <strong>{title}</strong>
              <span>{text}</span>
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
        <span className="public-eyebrow">Kurz erklärt</span>
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
        <span className="public-eyebrow">Alltag strukturieren</span>
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
        <span className="public-eyebrow">Funktionen</span>
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
        <span className="public-eyebrow">Rollen</span>
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
        <span className="public-eyebrow">Sicherheit & Zugriff</span>
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
        <span className="public-eyebrow">Tarifdetails</span>
        <h2>Tarifdetails</h2>
        <p>Nuria Pflege startet mit einem klaren Tarifmodell für ambulante Pflegedienste. Die Details werden transparent im Registrierungsprozess und im Tarifbereich angezeigt.</p>
      </motion.div>
      <motion.div className="public-price-card" variants={fadeUp} whileHover={cardHover}>
        <strong>Starttarif: 89 € / Monat</strong>
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
        <span className="public-eyebrow">Ablauf</span>
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
        <span className="public-eyebrow">FAQ</span>
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

function ContactPage() {
  return (
    <PublicSubPage title="Kontakt" intro="Nehmen Sie Kontakt mit Nuria Pflege auf.">
      <div className="public-info-card">
        <h2>Kontakt aufnehmen</h2>
        <p>Für Fragen zur Pflege Software und zur digitalen Organisation Ihres Pflegedienstes erreichen Sie uns per E-Mail.</p>
        <a className="public-button" href="mailto:kontakt@nuria-pflege.de">kontakt@nuria-pflege.de</a>
      </div>
    </PublicSubPage>
  );
}

function LegalPage({ page }: { page: Exclude<PublicPage, "home" | "features" | "pricing" | "contact"> }) {
  const content = {
    imprint: {
      title: "Impressum",
      intro: "Angaben gemäß § 5 TMG.",
      lines: ["Nuria Pflege", "Enrico Gross", "Einzelunternehmen", "Gerther Straße 76", "44577 Castrop-Rauxel", "Deutschland", "kontakt@nuria-pflege.de"],
    },
    privacy: {
      title: "Datenschutz",
      intro: "Informationen zum Umgang mit personenbezogenen Daten.",
      lines: [
        "Nuria Pflege verarbeitet Daten zur Bereitstellung geschützter Softwarebereiche.",
        "Interne Bereiche sind für registrierte Nutzer vorgesehen.",
        "Dokumente und Pflegedienstinformationen werden nicht öffentlich dargestellt.",
        "Anfragen zum Datenschutz können an kontakt@nuria-pflege.de gesendet werden.",
      ],
    },
    terms: {
      title: "AGB",
      intro: "Allgemeine Hinweise zur Nutzung von Nuria Pflege.",
      lines: [
        "Nuria Pflege ist eine Software-Plattform für ambulante Pflegedienste.",
        "Tarifdetails werden im Registrierungsprozess und im Tarifbereich angezeigt.",
        "Die Nutzung interner Bereiche setzt ein registriertes Benutzerkonto voraus.",
      ],
    },
    cookies: {
      title: "Cookie-Einstellungen",
      intro: "Hinweise zu Cookies und lokalen Einstellungen.",
      lines: [
        "Nuria Pflege setzt keine Tracking-Dienste auf der öffentlichen Website ein.",
        "Für Login und interne Bereiche können technisch notwendige Sitzungsdaten verwendet werden.",
        "Ein Cookie-Banner wird nicht erzwungen, solange keine Tracking-Cookies genutzt werden.",
      ],
    },
  }[page];

  return (
    <PublicSubPage intro={content.intro} title={content.title}>
      <div className="public-info-card">
        {content.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </PublicSubPage>
  );
}

function PublicSubPage({ children, intro, title }: { children: React.ReactNode; intro: string; title: string }) {
  return (
    <>
      <motion.section animate="visible" className="public-subhero" initial="hidden" variants={staggerContainer}>
        <motion.span className="public-eyebrow" variants={fadeUp}>Nuria Pflege</motion.span>
        <motion.h1 variants={fadeUp}>{title}</motion.h1>
        <motion.p variants={fadeUp}>{intro}</motion.p>
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
        {page === "features" ? (
          <PublicSubPage intro="Pflege Software für Dienstplanung Pflege, Tourenplanung Pflege, Zeiterfassung Pflege und digitale Organisation." title="Funktionen">
            <FeaturesSection />
            <RolesSection />
            <SecuritySection />
          </PublicSubPage>
        ) : null}
        {page === "pricing" ? (
          <PublicSubPage intro="Sachliche Tarifdetails für ambulante Pflegedienste." title="Tarifdetails">
            <PricingSection />
            <ProcessSection />
            <FaqSection />
          </PublicSubPage>
        ) : null}
        {page === "contact" ? <ContactPage /> : null}
        {page === "imprint" || page === "privacy" || page === "terms" || page === "cookies" ? <LegalPage page={page} /> : null}
      </main>
      <PublicFooter />
    </div>
  );
}
