import type { MetadataRoute } from "next";

const SITE_URL = "https://narihome.io.vn";
const DISALLOW_PATHS = [
  "/api/",
  "/quan-tri",
  "/quan-tri/",
  "/nhan-vien",
  "/nhan-vien/",
  "/khach-hang",
  "/khach-hang/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
