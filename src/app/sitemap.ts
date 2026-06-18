import type { MetadataRoute } from "next";
import { absoluteUrl, publicSeoEntries } from "@/lib/public-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSeoEntries.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
