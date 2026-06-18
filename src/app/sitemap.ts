import type { MetadataRoute } from "next";
import { absoluteUrl, publicSitemapEntries } from "@/lib/public-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemapEntries.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
