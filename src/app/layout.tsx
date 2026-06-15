import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nuria-pflege.de"),
  title: {
    default: "Nuria Pflege | Pflege Software für ambulante Pflegedienste",
    template: "%s | Nuria Pflege",
  },
  description:
    "Nuria Pflege ist eine Software für ambulante Pflegedienste zur digitalen Organisation von Dienstplanung, Tourenplanung, Zeiterfassung, Dokumenten und Kommunikation.",
  openGraph: {
    title: "Nuria Pflege | Pflege Software für ambulante Pflegedienste",
    description:
      "Digitale Organisation für ambulante Pflegedienste mit Dienstplanung, Touren, Mitarbeiter-Dashboard, Dokumenten und Kommunikation.",
    siteName: "Nuria Pflege",
    locale: "de_DE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
