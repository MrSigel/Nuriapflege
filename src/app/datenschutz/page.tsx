import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Datenschutz | Nuria Pflege",
  description: "Datenschutzhinweise von Nuria Pflege.",
  alternates: { canonical: "/datenschutz" },
};

export default function PrivacyPage() {
  return <PublicSite page="privacy" />;
}
