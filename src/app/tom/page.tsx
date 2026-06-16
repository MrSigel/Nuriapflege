import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Technische und organisatorische Maßnahmen | Nuria Pflege",
  description: "Informationen zu technischen und organisatorischen Maßnahmen bei Nuria Pflege.",
  alternates: { canonical: "/tom" },
};

export default function TechnicalMeasuresPage() {
  return <PublicSite page="tom" />;
}
