import type { Metadata } from "next";
import { publicSeoPages, siteUrl } from "@/lib/public-seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Nuria Pflege",
  category: "Software",
  title: {
    default: publicSeoPages.home.title,
    template: "%s | Nuria Pflege",
  },
  description: publicSeoPages.home.description,
  keywords: publicSeoPages.home.keywords,
  creator: "Nuria Pflege",
  publisher: "Nuria Pflege",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo_transparent.png",
    apple: "/logo_transparent.png",
  },
  openGraph: {
    title: publicSeoPages.home.title,
    description: publicSeoPages.home.description,
    url: "/",
    siteName: "Nuria Pflege",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/logo_transparent.png",
        alt: "Nuria Pflege",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: publicSeoPages.home.title,
    description: publicSeoPages.home.description,
    images: ["/logo_transparent.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
