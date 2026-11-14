import type { MetadataRoute } from "next";
import { categories, getAllCatalogProducts } from "@/lib/catalog";
import { clinicServices } from "@/lib/clinic-services";
import { getSupportTopics } from "@/lib/support-stores";

const BASE_URL = "https://hasaki.vn";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  // 1. Core Storefront Pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/deals-dang-dien-ra.html`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/san-pham-ban-chay.html`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/hang-moi-ve.html`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/campaign/wow`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/thuong-hieu`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/bang-gia-dich-vu.html`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cam-nang.html`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/he-thong-cua-hang`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ho-tro`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/bao-hanh`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/booking`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 2. All 36 Categories
  const categoryRoutes: MetadataRoute.Sitemap = categories.map(([, slug]) => ({
    url: `${BASE_URL}/danh-muc/${slug}`,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 3. All Catalog Products
  const seenProductSlugs = new Set<string>();
  const productRoutes: MetadataRoute.Sitemap = [];
  for (const product of getAllCatalogProducts()) {
    if (product.slug && !seenProductSlugs.has(product.slug)) {
      seenProductSlugs.add(product.slug);
      productRoutes.push({
        url: `${BASE_URL}/san-pham/${product.slug}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  // 4. All Clinic Services
  const seenServiceSlugs = new Set<string>();
  const clinicRoutes: MetadataRoute.Sitemap = [];
  for (const service of clinicServices) {
    if (service.slug && !seenServiceSlugs.has(service.slug)) {
      seenServiceSlugs.add(service.slug);
      clinicRoutes.push({
        url: `${BASE_URL}/dich-vu/${service.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // 5. All Support Topics
  const seenTopicSlugs = new Set<string>();
  const supportRoutes: MetadataRoute.Sitemap = [];
  for (const topic of getSupportTopics()) {
    if (topic.slug && !seenTopicSlugs.has(topic.slug)) {
      seenTopicSlugs.add(topic.slug);
      supportRoutes.push({
        url: `${BASE_URL}/ho-tro/${topic.slug}`,
        lastModified: currentDate,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return [
    ...coreRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...clinicRoutes,
    ...supportRoutes,
  ];
}
