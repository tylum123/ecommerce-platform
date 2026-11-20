import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { readPostgresBranchesSafely } from "@/lib/server/postgres-clinic-service";
import { CheckoutView } from "@/components/sites/nari/checkout-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [liveCatalog, branches] = await Promise.all([
    readStorefrontCatalog(),
    readPostgresBranchesSafely(getPostgresDatabase),
  ]);
  return <CheckoutView liveCatalog={liveCatalog} branches={branches} />;
}
