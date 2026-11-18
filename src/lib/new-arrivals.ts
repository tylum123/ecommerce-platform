import { money } from "@/lib/catalog";
import { getStaticCatalogOverrides, type LiveCatalogOverridesState } from "@/lib/live-catalog";

export interface NewArrivalDetail {
  url: string;
  title: string;
  specs: string[][];
  images: string[];
}

export interface NewArrivalItem {
  name: string;
  brand: string;
  url: string;
  image: string;
  price: string;
  old: string;
  description: string;
  slug: string;
  numericPrice: number;
  numericOld: number;
  detail?: NewArrivalDetail;
}

export const newArrivals: NewArrivalItem[] = [];

/** Derives new arrivals strictly from live catalog state. */
export function getNewArrivals(
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): NewArrivalItem[] {
  const deleted = new Set(live.deletedSlugs);
  return Object.values(live.products)
    .filter((item) => Boolean(item.slug) && !deleted.has(item.slug))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .map((ov) => ({
      name: ov.name,
      brand: ov.brand,
      url: `/san-pham/${ov.slug}`,
      image: ov.image,
      price: money(ov.price),
      old: ov.old > ov.price ? money(ov.old) : "",
      description: ov.description || "",
      slug: ov.slug,
      numericPrice: ov.price,
      numericOld: ov.old,
      detail: {
        url: `/san-pham/${ov.slug}`,
        title: ov.name,
        specs: (ov.specs || []).map((s) => [s.label, s.value]),
        images: ov.images?.length ? ov.images : ov.image ? [ov.image] : [],
      },
    }));
}
