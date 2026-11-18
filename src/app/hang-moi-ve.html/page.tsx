export const dynamic = "force-dynamic";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { NewArrivals } from "@/components/sites/hasaki/new-arrivals";

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort = "position" } = await searchParams;
  return <NewArrivals initialSort={sort} liveCatalog={await readStorefrontCatalog()} />;
}
