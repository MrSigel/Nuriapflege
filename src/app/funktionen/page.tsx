import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Funktionen | Nuria Pflege",
  description: "Überblick über die Funktionen von Nuria Pflege: Dienstplanung, Tourenplanung, Zeiterfassung, Dokumente, Kommunikation und rollenbasierte Mitarbeiterbereiche für ambulante Pflegedienste.",
  alternates: { canonical: "/funktionen" },
  openGraph: {
    title: "Funktionen | Nuria Pflege",
    description: "Überblick über Dienstplanung, Tourenplanung, Zeiterfassung, Dokumente, Kommunikation und rollenbasierte Mitarbeiterbereiche.",
    url: "/funktionen",
    siteName: "Nuria Pflege",
  },
};

export default function FeaturesPage() {
  return <PublicSite page="features" />;
}
