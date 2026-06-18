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
        "/api",
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/login/register",
        "/mitarbeiter",
        "/mitarbeiter/",
        "/nuria-admin",
        "/nuria-admin/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
