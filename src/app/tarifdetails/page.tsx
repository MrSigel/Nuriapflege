import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Tarifdetails | Nuria Pflege",
  description: "Sachliche Tarifdetails für Nuria Pflege, die Software für ambulante Pflegedienste.",
  alternates: { canonical: "/tarifdetails" },
};

export default function PricingPage() {
  return <PublicSite page="pricing" />;
}
