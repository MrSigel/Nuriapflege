import type { Metadata } from "next";

export const siteUrl = "https://nuria-pflege.de";

export type PublicSeoKey =
  | "home"
  | "features"
  | "pricing"
  | "contact"
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
};

export const publicSeoPages: Record<PublicSeoKey, PublicSeoPage> = {
  home: {
    path: "/",
    title: "Nuria Pflege | Pflege Software für ambulante Pflegedienste",
    description:
      "Nuria Pflege bündelt Dienstplanung, Tourenplanung, Zeiterfassung, Dokumente, Mitarbeiterorganisation und interne Kommunikation für ambulante Pflegedienste.",
    keywords: ["Pflege Software", "ambulanter Pflegedienst", "Dienstplanung Pflege", "Tourenplanung Pflege", "Zeiterfassung Pflege"],
    priority: 1,
    changeFrequency: "weekly",
  },
  features: {
    path: "/funktionen",
    title: "Funktionen",
    description:
      "Überblick über die Funktionen von Nuria Pflege: Dienstplanung, Tourenplanung, Zeiterfassung, Dokumente, Kommunikation und rollenbasierte Mitarbeiterbereiche.",
    keywords: ["Pflegedienst Funktionen", "Dienstplanung", "Tourenplanung", "Mitarbeiter Dashboard", "Pflegedokumente"],
    priority: 0.9,
    changeFrequency: "monthly",
  },
  pricing: {
    path: "/tarifdetails",
    title: "Tarifdetails",
    description:
      "Tarifdetails zu Nuria Pflege mit klaren Laufzeitoptionen und zentralen Funktionen für digitale Organisation im Pflegealltag.",
    keywords: ["Pflege Software Preis", "Nuria Pflege Tarif", "Pflegedienst Software Kosten"],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  contact: {
    path: "/kontakt",
    title: "Kontakt",
    description:
      "Kontakt zu Nuria Pflege für Fragen zur Registrierung, Einrichtung, Nutzung und Tarifdetails der Pflege-Software.",
    keywords: ["Nuria Pflege Kontakt", "Pflege Software Kontakt", "Pflegedienst Software Anfrage"],
    priority: 0.75,
    changeFrequency: "monthly",
  },
  legal: {
    path: "/rechtliches",
    title: "Rechtliches & Vertrauen",
    description:
      "Übersicht rechtlicher Informationen, Datenschutzgrundlagen, Impressum, AGB, Cookie-Hinweise, AV-Vertrag und TOM von Nuria Pflege.",
    keywords: ["Nuria Pflege Rechtliches", "Datenschutz Pflege Software", "AV Vertrag Pflege Software"],
    priority: 0.55,
    changeFrequency: "monthly",
  },
  imprint: {
    path: "/impressum",
    title: "Impressum",
    description: "Impressum und Anbieterkennzeichnung von Nuria Pflege.",
    keywords: ["Nuria Pflege Impressum", "Anbieterkennzeichnung Nuria Pflege"],
    priority: 0.45,
    changeFrequency: "monthly",
  },
  privacy: {
    path: "/datenschutz",
    title: "Datenschutz",
    description:
      "Datenschutzhinweise von Nuria Pflege zur Verarbeitung personenbezogener Daten, Hosting, Supabase, Cookies und Betroffenenrechten.",
    keywords: ["Nuria Pflege Datenschutz", "Pflege Software DSGVO", "Datenschutz Pflegedienst Software"],
    priority: 0.6,
    changeFrequency: "monthly",
  },
  terms: {
    path: "/agb",
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen für die Nutzung von Nuria Pflege.",
    keywords: ["Nuria Pflege AGB", "Pflege Software Nutzungsbedingungen"],
    priority: 0.45,
    changeFrequency: "monthly",
  },
  cookies: {
    path: "/cookie-einstellungen",
    title: "Cookie-Einstellungen",
    description: "Cookie-Einstellungen und Hinweise zu technisch notwendigen Cookies bei Nuria Pflege.",
    keywords: ["Nuria Pflege Cookies", "Cookie Einstellungen", "technisch notwendige Cookies"],
    priority: 0.4,
    changeFrequency: "monthly",
  },
  withdrawal: {
    path: "/widerruf",
    title: "Widerruf",
    description: "Hinweise zum Widerruf und zur B2B-Ausrichtung von Nuria Pflege.",
    keywords: ["Nuria Pflege Widerruf", "B2B Software Widerruf"],
    priority: 0.35,
    changeFrequency: "monthly",
  },
  dpa: {
    path: "/av-vertrag",
    title: "Auftragsverarbeitung",
    description: "Informationen zur Auftragsverarbeitung und zum AV-Vertrag nach Art. 28 DSGVO bei Nuria Pflege.",
    keywords: ["AV Vertrag", "Auftragsverarbeitung", "Art. 28 DSGVO", "Nuria Pflege AVV"],
    priority: 0.5,
    changeFrequency: "monthly",
  },
  tom: {
    path: "/tom",
    title: "Technische und organisatorische Maßnahmen",
    description: "Übersicht technischer und organisatorischer Maßnahmen zum Schutz der Verarbeitung bei Nuria Pflege.",
    keywords: ["TOM", "technische organisatorische Maßnahmen", "Nuria Pflege Sicherheit"],
    priority: 0.5,
    changeFrequency: "monthly",
  },
};

export const publicSeoEntries = Object.entries(publicSeoPages).map(([key, page]) => ({
  key: key as PublicSeoKey,
  ...page,
}));

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
  };
}
