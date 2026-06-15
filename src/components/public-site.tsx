"use client";

import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Route,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";

type PublicPage = "home" | "features" | "pricing" | "contact" | "imprint" | "privacy" | "terms" | "cookies";

const fade = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.28, ease: "easeOut" },
} as const;

const modules = [
  ["Dienstplanung", "Dienste strukturiert planen und den Überblick über Einsätze behalten.", CalendarDays],
  ["Tourenplanung", "Touren für den Pflegealltag organisieren und Mitarbeiteransichten vorbereiten.", Route],
  ["Mitarbeiter-Dashboard", "Mitarbeiter sehen eigene Dienste, Touren, Nachrichten und relevante Aufgaben.", UserCog],
  ["Klientenübersicht", "Klienteninformationen zentral verwalten und je Berechtigung zugänglich machen.", Users],
  ["Zeiterfassung", "Arbeitszeiten digital erfassen und nachvollziehbar strukturieren.", Clock3],
  ["Dokumente hochladen", "Dokumente intern ablegen, ohne sie öffentlich darzustellen.", FolderOpen],
  ["Notizen & Übergaben", "Übergaben und interne Hinweise zentral sammeln.", FileText],
  ["Kommunikation", "Interne Nachrichten für Teams und einzelne Mitarbeiter bündeln.", MessageCircle],
  ["Abwesenheiten / Urlaub", "Urlaub, Krankheit und Abwesenheiten im Mitarbeiterbereich abbilden.", CalendarDays],
  ["Rollen & Rechte", "Zugriffe über Rollen und Berechtigungen strukturieren.", ShieldCheck],
  ["Standorte", "Mehrere Standorte innerhalb eines Pflegedienstes organisieren.", MapPin],
  ["Einstellungen", "Grunddaten und organisatorische Einstellungen verwalten.", Settings],
] as const;

const problems = [
  "Dienstpläne liegen an mehreren Stellen",
  "Touren werden manuell abgestimmt",
  "Zeiten müssen nachgetragen werden",
  "Dokumente und Verordnungen gehen im Alltag unter",
  "Übergaben sind nicht zentral gesammelt",
  "Mitarbeiter benötigen mobile Übersicht",
];

const roles = [
  ["Inhaber", "Gesamtübersicht, Mitarbeiter, Standorte, Rollen, Einstellungen und Organisation."],
  ["PDL", "Planung, Touren, Klienten, Mitarbeiterkoordination und operative Abläufe je Berechtigung."],
  ["Verwaltung", "Organisation, Dokumente, Kommunikation und administrative Aufgaben je Berechtigung."],
  ["Mitarbeiter", "Eigener Dienstplan, eigene Tour, eigene Patienten, Zeiterfassung, Dokumente und interne Nachrichten."],
] as const;

const security = [
  "Rollenbasierte Ansichten",
  "Mandantentrennung pro Pflegedienst",
  "Mitarbeiter sehen nur eigene oder zugewiesene Inhalte",
  "Dokumente werden nicht öffentlich dargestellt",
  "Interne Bereiche sind geschützt",
];

function PublicNav() {
  return (
    <header className="public-nav">
      <Link className="public-brand" href="/">
        <span>N</span>
        Nuria Pflege
      </Link>
      <nav aria-label="Öffentliche Navigation">
        <Link href="/funktionen">Funktionen</Link>
        <Link href="/tarifdetails">Tarifdetails</Link>
        <Link href="/kontakt">Kontakt</Link>
        <Link href="/login">Login</Link>
      </nav>
      <Link className="public-nav-cta" href="/registrieren">
        Registrieren
      </Link>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div>
        <strong>Nuria Pflege</strong>
        <p>Digitale Pflege Software für ambulante Pflegedienste zur strukturierten Organisation des Pflegealltags.</p>
        <a href="mailto:kontakt@nuria-pflege.de">kontakt@nuria-pflege.de</a>
      </div>
      <div>
        <Link href="/funktionen">Funktionen</Link>
        <Link href="/tarifdetails">Tarifdetails</Link>
        <Link href="/kontakt">Kontakt</Link>
      </div>
      <div>
        <Link href="/login">Login</Link>
        <Link href="/registrieren">Registrieren</Link>
        <Link href="/cookie-einstellungen">Cookie-Einstellungen</Link>
      </div>
      <div>
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/agb">AGB</Link>
      </div>
    </footer>
  );
}

function Hero() {
  return (
    <section className="public-hero">
      <motion.div {...fade} className="public-hero-copy">
        <span className="public-eyebrow">Software für ambulante Pflegedienste</span>
        <h1>Mehr Übersicht im Pflegealltag.</h1>
        <p>
          Nuria Pflege bündelt Dienstplanung, Touren, Mitarbeiterorganisation, Dokumente, Zeiterfassung und interne
          Kommunikation in einem digitalen System für ambulante Pflegedienste.
        </p>
        <div className="public-actions">
          <Link className="public-button" href="/registrieren">
            Jetzt registrieren
          </Link>
          <Link className="public-button secondary" href="/funktionen">
            Funktionen ansehen
          </Link>
        </div>
      </motion.div>
      <motion.div {...fade} className="public-dashboard-preview" aria-label="Neutrale Software-Vorschau">
        <div className="preview-bar">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-grid">
          <div>
            <strong>Dienstplanung</strong>
            <span>Strukturierte Einsatzübersicht</span>
          </div>
          <div>
            <strong>Touren</strong>
            <span>Geordnete Tagesplanung</span>
          </div>
          <div>
            <strong>Kommunikation</strong>
            <span>Interne Nachrichten</span>
          </div>
          <div>
            <strong>Dokumente</strong>
            <span>Geschützte Ablage</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function HomeSections() {
  return (
    <>
      <Hero />
      <motion.section {...fade} className="public-section compact" id="funktionen">
        <span className="public-eyebrow">Kurz erklärt</span>
        <h2>Eine Plattform für den Pflegealltag.</h2>
        <p>Nuria Pflege unterstützt Pflegedienste dabei, interne Abläufe digital zu bündeln – von der Planung bis zur täglichen Mitarbeiteransicht.</p>
      </motion.section>
      <motion.section {...fade} className="public-section">
        <h2>Typische Aufgaben im Alltag.</h2>
        <div className="public-list-grid">
          {problems.map((item) => (
            <div className="public-list-item" key={item}>
              <CheckCircle2 size={18} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </motion.section>
      <FeaturesSection />
      <RolesSection />
      <SecuritySection />
      <PricingSection />
      <ProcessSection />
      <FinalCta />
    </>
  );
}

function FeaturesSection() {
  return (
    <motion.section {...fade} className="public-section">
      <h2>Wichtige Bereiche an einem Ort.</h2>
      <div className="public-card-grid">
        {modules.map(([title, text, Icon]) => (
          <motion.article className="public-card" key={title} whileHover={{ y: -2 }}>
            <Icon size={20} />
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
    <motion.section {...fade} className="public-section">
      <h2>Für verschiedene Rollen im Pflegedienst.</h2>
      <div className="public-role-grid">
        {roles.map(([title, text]) => (
          <article className="public-card" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function SecuritySection() {
  return (
    <motion.section {...fade} className="public-section public-split">
      <div>
        <span className="public-eyebrow">Sicherheit & Zugriff</span>
        <h2>Zugriffe klar geregelt.</h2>
        <p>Interne Bereiche sind auf Rollen, Pflegedienste und zugewiesene Inhalte ausgerichtet.</p>
      </div>
      <div className="public-list-stack">
        {security.map((item) => (
          <div className="public-list-item" key={item}>
            <LockKeyhole size={18} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function PricingSection() {
  return (
    <motion.section {...fade} className="public-section public-pricing">
      <div>
        <span className="public-eyebrow">Tarifdetails</span>
        <h2>Tarifdetails</h2>
        <p>Nuria Pflege startet mit einem klaren Tarifmodell für ambulante Pflegedienste. Die Details werden transparent im Registrierungsprozess und im Tarifbereich angezeigt.</p>
      </div>
      <div className="public-price-card">
        <strong>Starttarif: 89 € / Monat</strong>
        <span>3 Monate: 5 % Rabatt</span>
        <span>6 Monate: 10 % Rabatt</span>
        <span>12 Monate: 15 % Rabatt</span>
        <Link className="public-button secondary" href="/tarifdetails">
          Tarifdetails ansehen
        </Link>
      </div>
    </motion.section>
  );
}

function ProcessSection() {
  const steps = ["Pflegedienst registrieren", "Tarif auswählen", "Zugang einrichten", "Mitarbeiter und Rollen anlegen", "Pflegealltag digital organisieren"];
  return (
    <motion.section {...fade} className="public-section">
      <h2>So starten Pflegedienste mit Nuria Pflege.</h2>
      <div className="public-step-grid">
        {steps.map((step, index) => (
          <article className="public-step" key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function FinalCta() {
  return (
    <motion.section {...fade} className="public-cta">
      <h2>Starten Sie mit einer klaren digitalen Struktur für Ihren Pflegedienst.</h2>
      <div className="public-actions">
        <Link className="public-button" href="/registrieren">
          Jetzt registrieren
        </Link>
        <Link className="public-button secondary" href="/kontakt">
          Kontakt aufnehmen
        </Link>
      </div>
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
      <motion.section {...fade} className="public-subhero">
        <span className="public-eyebrow">Nuria Pflege</span>
        <h1>{title}</h1>
        <p>{intro}</p>
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
          <PublicSubPage intro="Pflege Software für Dienstplanung, Tourenplanung Pflege, Zeiterfassung Pflege und interne Organisation." title="Funktionen">
            <FeaturesSection />
            <RolesSection />
            <SecuritySection />
          </PublicSubPage>
        ) : null}
        {page === "pricing" ? (
          <PublicSubPage intro="Sachliche Tarifdetails für ambulante Pflegedienste." title="Tarifdetails">
            <PricingSection />
            <ProcessSection />
          </PublicSubPage>
        ) : null}
        {page === "contact" ? <ContactPage /> : null}
        {page === "imprint" || page === "privacy" || page === "terms" || page === "cookies" ? <LegalPage page={page} /> : null}
      </main>
      <PublicFooter />
    </div>
  );
}
