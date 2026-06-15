import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Nuria Pflege | Pflege Software für ambulante Pflegedienste",
  description:
    "Nuria Pflege unterstützt ambulante Pflegedienste bei Dienstplanung, Tourenplanung Pflege, Zeiterfassung Pflege und digitaler Organisation.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Nuria Pflege | Pflege Software für ambulante Pflegedienste",
    description: "Digitale Organisation für ambulante Pflegedienste mit Dienstplanung, Touren, Dokumenten, Zeiterfassung und Kommunikation.",
    url: "/",
    siteName: "Nuria Pflege",
    type: "website",
  },
};

export default function Home() {
  return <PublicSite />;
}
