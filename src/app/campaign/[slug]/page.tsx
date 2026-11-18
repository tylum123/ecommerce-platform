import { CampaignWowView } from "@/components/sites/nari/campaign-wow-view";
import { getCampaignWowData } from "@/lib/campaigns-location";
import { notFound } from "next/navigation";
import { isKnownCampaign, getCampaignProducts } from "@/lib/campaign-catalog";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

export default async function CampaignSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isKnownCampaign(slug)) notFound();
  const campaignData = getCampaignWowData();
  const catalog = await readStorefrontCatalog();
  return <CampaignWowView campaignData={campaignData} products={getCampaignProducts(catalog)} />;
}
