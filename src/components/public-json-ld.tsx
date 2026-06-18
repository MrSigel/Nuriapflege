import { absoluteUrl, pageTitle, publicSeoPages, type PublicSeoKey } from "@/lib/public-seo";

const organization = {
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: "Nuria Pflege",
  url: absoluteUrl("/"),
  logo: absoluteUrl("/logo_transparent.png"),
  contactPoint: {
    "@type": "ContactPoint",
    email: "kontakt@nuria-pflege.de",
    contactType: "customer support",
    areaServed: "DE",
    availableLanguage: "de",
  },
};

const softwareApplication = {
  "@type": "SoftwareApplication",
  "@id": absoluteUrl("/#software"),
  name: "Nuria Pflege",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/"),
  description: publicSeoPages.home.description,
  offers: {
    "@type": "Offer",
    price: "89.00",
    priceCurrency: "EUR",
    url: absoluteUrl("/tarifdetails"),
  },
  provider: {
    "@id": absoluteUrl("/#organization"),
  },
};

const website = {
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: "Nuria Pflege",
  url: absoluteUrl("/"),
  publisher: {
    "@id": absoluteUrl("/#organization"),
  },
  inLanguage: "de-DE",
};

const homeFaq = {
  "@type": "FAQPage",
  "@id": absoluteUrl("/#faq"),
  mainEntity: [
    {
      "@type": "Question",
      name: "Für wen ist Nuria Pflege gedacht?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nuria Pflege ist für ambulante Pflegedienste gedacht, die Dienstplanung, Touren, Mitarbeiterorganisation, Dokumente, Zeiterfassung und interne Kommunikation digital bündeln möchten.",
      },
    },
    {
      "@type": "Question",
      name: "Welche Rollen gibt es im System?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nuria Pflege arbeitet mit Rollen wie Inhaber, PDL, Verwaltung und Mitarbeiter. Sichtbare Bereiche richten sich nach Rolle und Berechtigung.",
      },
    },
    {
      "@type": "Question",
      name: "Kann ich Mitarbeiter einladen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Mitarbeiter können angelegt oder eingeladen und passenden Rollen zugeordnet werden.",
      },
    },
  ],
};

function breadcrumb(page: PublicSeoKey) {
  const currentPage = publicSeoPages[page];
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Startseite",
      item: absoluteUrl("/"),
    },
  ];

  if (currentPage.path !== "/") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: currentPage.title,
      item: absoluteUrl(currentPage.path),
    });
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function PublicJsonLd({ page }: { page: PublicSeoKey }) {
  const currentPage = publicSeoPages[page];
  const graph: Array<Record<string, unknown>> = [
    organization,
    website,
    breadcrumb(page),
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(currentPage.path)}#webpage`,
      url: absoluteUrl(currentPage.path),
      name: pageTitle(currentPage),
      description: currentPage.description,
      isPartOf: {
        "@id": absoluteUrl("/#website"),
      },
      inLanguage: "de-DE",
    },
  ];

  if (page === "home" || page === "features" || page === "pricing") {
    graph.push(softwareApplication);
  }

  if (page === "home") {
    graph.push(homeFaq);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
