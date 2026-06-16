import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Tarifdetails | Nuria Pflege",
  description: "Tarifdetails zu Nuria Pflege für ambulante Pflegedienste. Klare Laufzeitoptionen und zentrale Funktionen für digitale Organisation im Pflegealltag.",
  alternates: { canonical: "/tarifdetails" },
  openGraph: {
    title: "Tarifdetails | Nuria Pflege",
    description: "Klare Laufzeitoptionen und zentrale Funktionen für digitale Organisation im Pflegealltag.",
    url: "/tarifdetails",
    siteName: "Nuria Pflege",
  },
};

export default function PricingPage() {
  return <PublicSite page="pricing" />;
}
