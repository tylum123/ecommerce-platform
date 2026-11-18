import campaignsData from "../../docs/research/hasaki/campaigns-home-2026-11-13.json";
import { getTagPageData, type TagPageData } from "@/lib/campaigns-location";
import type { LiveCatalogOverridesState, LiveProductOverride } from "@/lib/live-catalog";

/** Only observed metadata establishes supported routes; an arbitrary slug is not a campaign. */
export function getKnownTagPage(slug: string): TagPageData | null {
  const normalized = slug.endsWith(".html") ? slug : `${slug}.html`;
  if (!Object.hasOwn(campaignsData.tagPages, normalized)) return null;
  return getTagPageData(normalized);
}

export function isKnownCampaign(slug: string): boolean {
  return new URL(campaignsData.campaignWow.url).pathname === `/campaign/${slug}`;
}

/** Membership needs its own verified source. The editorial snapshot contains none.
 * Never infer it from all catalog rows, prices, brands, arrival or flash-deal status.
 */
export function getCampaignProducts(
  catalog: LiveCatalogOverridesState,
  memberSlugs: readonly string[] = [],
): LiveProductOverride[] {
  const hidden = new Set(catalog.deletedSlugs);
  return [...new Set(memberSlugs)].flatMap(slug => {
    const product = catalog.products[slug];
    return product && !hidden.has(slug) ? [product] : [];
  });
}
