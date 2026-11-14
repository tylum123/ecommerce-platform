import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/quan-tri", "/quan-tri/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/quan-tri", "/quan-tri/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/quan-tri", "/quan-tri/"],
      },
    ],
    sitemap: "https://Nari Home/sitemap.xml",
    host: "https://Nari Home",
  };
}
