import type { Metadata } from "next";
import { CampaignWowView } from "@/components/sites/nari/campaign-wow-view";
import { getCampaignWowData } from "@/lib/campaigns-location";
import { getCampaignProducts } from "@/lib/campaign-catalog";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khuyến Mãi Mỹ Phẩm Giá Tốt, Ưu Đãi Khủng | Nari Home",
  description:
    "Top Deal Mỹ Phẩm, tổng hợp chương trình khuyến mãi mỹ phẩm giá tốt. Săn Deals Mỹ Phẩm Ưu Đãi Lớn Tại Nari Home",
  openGraph: {
    title: "Khuyến Mãi Mỹ Phẩm Giá Tốt, Ưu Đãi Khủng | Nari Home",
    description:
      "Top Deal Mỹ Phẩm, tổng hợp chương trình khuyến mãi mỹ phẩm giá tốt. Săn Deals Mỹ Phẩm Ưu Đãi Lớn Tại Nari Home",
    url: "https://narihome.io.vn/campaign/wow",
  },
};

export default async function CampaignWowPage() {
  const campaignData = getCampaignWowData();
  const catalog = await readStorefrontCatalog();
  return <CampaignWowView campaignData={campaignData} products={getCampaignProducts(catalog)} />;
}
