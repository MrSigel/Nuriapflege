import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "AGB | Nuria Pflege",
  description: "Allgemeine Hinweise zur Nutzung von Nuria Pflege.",
  alternates: { canonical: "/agb" },
};

export default function TermsPage() {
  return <PublicSite page="terms" />;
}
