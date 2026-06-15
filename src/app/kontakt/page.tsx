import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Kontakt | Nuria Pflege",
  description: "Kontakt zu Nuria Pflege für Fragen zur Pflege Software und digitalen Organisation ambulanter Pflegedienste.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return <PublicSite page="contact" />;
}
