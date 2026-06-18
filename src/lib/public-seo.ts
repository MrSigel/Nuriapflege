import type { Metadata } from "next";

export const siteUrl = "https://www.nuria-pflege.de";

export type PublicSeoKey =
  | "home"
  | "features"
  | "pricing"
  | "contact"
  | "login"
  | "register"
  | "legal"
  | "imprint"
  | "privacy"
  | "terms"
  | "cookies"
  | "withdrawal"
  | "dpa"
  | "tom";

type PublicSeoPage = {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
  changeFrequency: "weekly" | "monthly";
  includeInSitemap: boolean;
};

export const publicSeoPages: Record<PublicSeoKey, PublicSeoPage> = {
  home: {
    path: "/",
    title: "Nuria Pflege | Pflege Software für ambulante Pflegedienste",
    description:
      "Nuria Pflege ist eine Pflege Software für ambulante Pflegedienste zur digitalen Pflegeverwaltung, Dienstplanung, Tourenplanung, Zeiterfassung und internen Organisation.",
    keywords: [
      "Pflege Software",
      "Pflegesoftware",
      "Software für ambulante Pflegedienste",
      "ambulante Pflege Software",
      "digitale Pflegeverwaltung",
      "Pflegealltag digital organisieren",
    ],
    priority: 1,
    changeFrequency: "weekly",
    includeInSitemap: true,
  },
  features: {
    path: "/funktionen",
    title: "Funktionen der Pflege Software",
    description:
      "Funktionen von Nuria Pflege für Dienstplanung Pflege, Tourenplanung Pflege, Mitarbeiterverwaltung, Klientenverwaltung, Dokumentenverwaltung, Zeiterfassung und Kommunikation.",
    keywords: [
      "Dienstplanung Pflege",
      "Tourenplanung Pflege",
      "Mitarbeiterverwaltung Pflege",
      "Klientenverwaltung Pflege",
      "Dokumentenverwaltung Pflege",
      "Zeiterfassung Pflegedienst",
      "Kommunikation Pflegedienst",
      "Rollen und Rechte Pflege Software",
    ],
    priority: 0.9,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  pricing: {
    path: "/tarifdetails",
    title: "Pflege Software Tarifdetails",
    description:
      "Tarifdetails zu Nuria Pflege: Pflege Software Tarif, monatliche Pflegesoftware und Kosten für digitale Organisation ambulanter Pflegedienste.",
    keywords: ["Pflegesoftware Preis", "Pflege Software Tarif", "Software für Pflegedienste Kosten", "digitale Pflegesoftware monatlich"],
    priority: 0.85,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  contact: {
    path: "/kontakt",
    title: "Kontakt",
    description:
      "Kontakt zu Nuria Pflege für Fragen zur Pflege Software, Registrierung, Einrichtung, Nutzung und Tarifdetails der Pflegedienst Software.",
    keywords: ["Nuria Pflege Kontakt", "Pflege Software Kontakt", "Pflegedienst Software Anfrage"],
    priority: 0.75,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  login: {
    path: "/login",
    title: "Anmelden",
    description:
      "Anmeldung bei Nuria Pflege für registrierte Pflegedienste, die ihre Pflege Software für Dienstplanung, Tourenplanung, Zeiterfassung und interne Verwaltung nutzen.",
    keywords: ["Nuria Pflege Login", "Pflege Software anmelden", "Pflegedienst Software Login"],
    priority: 0.35,
    changeFrequency: "monthly",
    includeInSitemap: false,
  },
  register: {
    path: "/registrieren",
    title: "Pflegedienst registrieren",
    description:
      "Pflegedienst bei Nuria Pflege registrieren und Software für ambulante Pflegedienste zur digitalen Pflegeverwaltung einrichten.",
    keywords: ["Pflege Software registrieren", "Pflegedienst Software anmelden", "Software für ambulante Pflegedienste Registrierung"],
    priority: 0.7,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  legal: {
    path: "/rechtliches",
    title: "Rechtliches & Vertrauen",
    description:
      "Übersicht rechtlicher Informationen, Datenschutzgrundlagen, Impressum, AGB, Cookie-Hinweise, AV-Vertrag und TOM von Nuria Pflege.",
    keywords: ["Nuria Pflege Rechtliches", "Datenschutz Pflege Software", "AV Vertrag Pflege Software"],
    priority: 0.55,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  imprint: {
    path: "/impressum",
    title: "Impressum",
    description: "Impressum und Anbieterkennzeichnung von Nuria Pflege.",
    keywords: ["Nuria Pflege Impressum", "Anbieterkennzeichnung Nuria Pflege"],
    priority: 0.45,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  privacy: {
    path: "/datenschutz",
    title: "Datenschutz",
    description:
      "Datenschutzhinweise von Nuria Pflege zur Verarbeitung personenbezogener Daten, Hosting, Supabase, Cookies und Betroffenenrechten.",
    keywords: ["Nuria Pflege Datenschutz", "Pflege Software DSGVO", "Datenschutz Pflegedienst Software"],
    priority: 0.6,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  terms: {
    path: "/agb",
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen für die Nutzung von Nuria Pflege.",
    keywords: ["Nuria Pflege AGB", "Pflege Software Nutzungsbedingungen"],
    priority: 0.45,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  cookies: {
    path: "/cookie-einstellungen",
    title: "Cookie-Einstellungen",
    description: "Cookie-Einstellungen und Hinweise zu technisch notwendigen Cookies bei Nuria Pflege.",
    keywords: ["Nuria Pflege Cookies", "Cookie Einstellungen", "technisch notwendige Cookies"],
    priority: 0.4,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  withdrawal: {
    path: "/widerruf",
    title: "Widerruf",
    description: "Hinweise zum Widerruf und zur B2B-Ausrichtung von Nuria Pflege.",
    keywords: ["Nuria Pflege Widerruf", "B2B Software Widerruf"],
    priority: 0.35,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  dpa: {
    path: "/av-vertrag",
    title: "Auftragsverarbeitung",
    description: "Informationen zur Auftragsverarbeitung und zum AV-Vertrag nach Art. 28 DSGVO bei Nuria Pflege.",
    keywords: ["AV Vertrag", "Auftragsverarbeitung", "Art. 28 DSGVO", "Nuria Pflege AVV"],
    priority: 0.5,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
  tom: {
    path: "/tom",
    title: "Technische und organisatorische Maßnahmen",
    description: "Übersicht technischer und organisatorischer Maßnahmen zum Schutz der Verarbeitung bei Nuria Pflege.",
    keywords: ["TOM", "technische organisatorische Maßnahmen", "Nuria Pflege Sicherheit"],
    priority: 0.5,
    changeFrequency: "monthly",
    includeInSitemap: true,
  },
};

export const publicSeoEntries = Object.entries(publicSeoPages).map(([key, page]) => ({
  key: key as PublicSeoKey,
  ...page,
}));

export const publicSitemapEntries = publicSeoEntries.filter((page) => page.includeInSitemap);

export const privateRobotsMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function pageTitle(page: PublicSeoPage) {
  return page.path === "/" ? page.title : `${page.title} | Nuria Pflege`;
}

export function createPublicMetadata(key: PublicSeoKey): Metadata {
  const page = publicSeoPages[key];
  const title = page.path === "/" ? { absolute: page.title } : page.title;
  const brandedTitle = pageTitle(page);

  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      title: brandedTitle,
      description: page.description,
      url: page.path,
      siteName: "Nuria Pflege",
      locale: "de_DE",
      type: "website",
      images: [
        {
          url: "/logo_transparent.png",
          alt: "Nuria Pflege",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: brandedTitle,
      description: page.description,
      images: ["/logo_transparent.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
