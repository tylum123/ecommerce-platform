import type { Metadata } from "next";
import { CampaignWowView } from "@/components/sites/hasaki/campaign-wow-view";
import { getCampaignWowData } from "@/lib/campaigns-location";

export const metadata: Metadata = {
  title: "Khuyến Mãi Mỹ Phẩm Giá Tốt, Ưu Đãi Khủng | Nari Home",
  description:
    "Top Deal Mỹ Phẩm, tổng hợp chương trình khuyến mãi mỹ phẩm giá tốt. Săn Deals Mỹ Phẩm Ưu Đãi Lớn Tại Nari Home",
  openGraph: {
    title: "Khuyến Mãi Mỹ Phẩm Giá Tốt, Ưu Đãi Khủng | Nari Home",
    description:
      "Top Deal Mỹ Phẩm, tổng hợp chương trình khuyến mãi mỹ phẩm giá tốt. Săn Deals Mỹ Phẩm Ưu Đãi Lớn Tại Nari Home",
    url: "https://Nari Home/campaign/wow",
  },
};

export default function CampaignWowPage() {
  const campaignData = getCampaignWowData();
  return <CampaignWowView campaignData={campaignData} />;
}
