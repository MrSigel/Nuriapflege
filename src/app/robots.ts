import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/public-seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/dashboard",
        "/dashboard/",
        "/login",
        "/login/",
        "/mitarbeiter",
        "/mitarbeiter/",
        "/nuria-admin",
        "/nuria-admin/",
        "/registrieren",
        "/registrieren/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
