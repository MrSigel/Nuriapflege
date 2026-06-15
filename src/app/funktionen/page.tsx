import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Funktionen | Nuria Pflege",
  description: "Funktionen von Nuria Pflege: Dienstplanung Pflege, Tourenplanung Pflege, Zeiterfassung Pflege, Mitarbeiter-Dashboard Pflege und Dokumente.",
  alternates: { canonical: "/funktionen" },
};

export default function FeaturesPage() {
  return <PublicSite page="features" />;
}
