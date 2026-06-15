import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Cookie-Einstellungen | Nuria Pflege",
  description: "Cookie-Einstellungen und Hinweise zu technisch notwendigen Sitzungsdaten bei Nuria Pflege.",
  alternates: { canonical: "/cookie-einstellungen" },
};

export default function CookiesPage() {
  return <PublicSite page="cookies" />;
}
