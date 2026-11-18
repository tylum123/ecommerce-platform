import { TagView } from "@/components/sites/nari/tag-view";
import { notFound } from "next/navigation";
import { getKnownTagPage, getCampaignProducts } from "@/lib/campaign-catalog";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tagData = getKnownTagPage(slug);
  if (!tagData) notFound();
  const catalog = await readStorefrontCatalog();
  return <TagView tagData={tagData} products={getCampaignProducts(catalog)} />;
}
