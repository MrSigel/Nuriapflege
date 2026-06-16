import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Auftragsverarbeitung | Nuria Pflege",
  description: "Informationen zur Auftragsverarbeitung und zum AV-Vertrag bei Nuria Pflege.",
  alternates: { canonical: "/av-vertrag" },
};

export default function DataProcessingAgreementPage() {
  return <PublicSite page="dpa" />;
}
