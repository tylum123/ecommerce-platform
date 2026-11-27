import type { MetadataRoute } from "next";
import { BRAND_CONFIG } from "@/lib/brand-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = `https://${BRAND_CONFIG.domain}`;
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
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
