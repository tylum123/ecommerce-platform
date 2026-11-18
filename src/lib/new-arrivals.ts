import snapshot from "../../docs/research/hasaki/new-arrivals-2026-11-13.json";
import details from "../../docs/research/hasaki/new-product-details-2026-11-13.json";
import { money } from "@/lib/catalog";
import { getStaticCatalogOverrides, type LiveCatalogOverridesState } from "@/lib/live-catalog";

export const newArrivals = snapshot.map(item => ({
  ...item,
  slug: item.url.split("/").pop() ?? "",
  numericPrice: Number(item.price.replace(/[^0-9]/g, "")),
  numericOld: Number((item.old ?? "").replace(/[^0-9]/g, "")),
  detail: details.find(detail => detail.url === item.url),
}));

/** Membership and order remain the dated source snapshot; overrides update values only. */
export function getNewArrivals(live: LiveCatalogOverridesState = getStaticCatalogOverrides()): typeof newArrivals {
  if (live.source === "postgres") return [];
  const deleted = new Set(live.deletedSlugs);
  return newArrivals.filter((item) => !deleted.has(item.slug)).map((item) => {
    const override = live.products[item.slug];
    if (!override) return item;
    return {
      ...item, name: override.name, brand: override.brand, description: override.description ?? item.description,
      image: override.image, price: money(override.price), old: override.old > override.price ? money(override.old) : "",
      numericPrice: override.price, numericOld: override.old,
      detail: item.detail ? { ...item.detail, images: override.images?.length ? override.images : [override.image] } : undefined,
    };
  });
}
