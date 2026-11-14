import { CampaignWowView } from "@/components/sites/hasaki/campaign-wow-view";
import { getCampaignWowData } from "@/lib/campaigns-location";

export default async function CampaignSlugPage() {
  const campaignData = getCampaignWowData();
  return <CampaignWowView campaignData={campaignData} />;
}
