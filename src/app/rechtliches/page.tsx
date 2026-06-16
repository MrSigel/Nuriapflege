import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Rechtliches & Vertrauen | Nuria Pflege",
  description: "Übersicht rechtlicher Informationen und Vertrauensgrundlagen von Nuria Pflege.",
  alternates: { canonical: "/rechtliches" },
};

export default function LegalOverviewPage() {
  return <PublicSite page="legal" />;
}
