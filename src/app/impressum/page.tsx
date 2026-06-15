import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Impressum | Nuria Pflege",
  description: "Impressum von Nuria Pflege.",
  alternates: { canonical: "/impressum" },
};

export default function ImprintPage() {
  return <PublicSite page="imprint" />;
}
