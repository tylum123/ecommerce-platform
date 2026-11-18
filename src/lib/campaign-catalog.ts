import {
  KNOWN_TAG_PAGES,
  getCampaignWowData,
  getTagPageData,
  type TagPageData,
} from "@/lib/campaigns-location";
import type { LiveCatalogOverridesState, LiveProductOverride } from "@/lib/live-catalog";

/** Only supported campaign/tag metadata establishes valid routes; an arbitrary slug is not a campaign. */
export function getKnownTagPage(slug: string): TagPageData | null {
  const normalized = slug.endsWith(".html") ? slug : `${slug}.html`;
  if (!Object.hasOwn(KNOWN_TAG_PAGES, normalized)) return null;
  return getTagPageData(normalized);
}

export function isKnownCampaign(slug: string): boolean {
  return new URL(getCampaignWowData().url).pathname === `/campaign/${slug}`;
}

/** Membership is explicit from verified live catalog overrides; never infer it from unrelated rows. */
export function getCampaignProducts(
  catalog: LiveCatalogOverridesState,
  memberSlugs: readonly string[] = [],
): LiveProductOverride[] {
  const hidden = new Set(catalog.deletedSlugs);
  return [...new Set(memberSlugs)].flatMap((slug) => {
    const product = catalog.products[slug];
    return product && !hidden.has(slug) ? [product] : [];
  });
}
