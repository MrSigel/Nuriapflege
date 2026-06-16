import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Kontakt | Nuria Pflege",
  description: "Kontakt zu Nuria Pflege für Fragen zur Registrierung, Einrichtung, Nutzung und Tarifdetails der Pflege-Software für ambulante Pflegedienste.",
  alternates: { canonical: "/kontakt" },
  openGraph: {
    title: "Kontakt | Nuria Pflege",
    description: "Kontakt zu Nuria Pflege für Fragen zur Registrierung, Einrichtung, Nutzung und Tarifdetails.",
    url: "/kontakt",
    siteName: "Nuria Pflege",
  },
};

export default function ContactPage() {
  return <PublicSite page="contact" />;
}
