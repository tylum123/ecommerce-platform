import { HomeView } from "@/components/sites/nari/home-view";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <HomeView liveCatalog={await readStorefrontCatalog()} />;
}
