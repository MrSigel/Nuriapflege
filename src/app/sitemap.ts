import type { MetadataRoute } from "next";

const publicRoutes = [
  "",
  "/funktionen",
  "/tarifdetails",
  "/registrieren",
  "/login",
  "/kontakt",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/cookie-einstellungen",
  "/widerruf",
  "/av-vertrag",
  "/tom",
  "/rechtliches",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nuria-pflege.de";

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
