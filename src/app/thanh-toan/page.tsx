import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { CheckoutView } from "@/components/sites/hasaki/checkout-view";
export const dynamic = "force-dynamic";
export default async function Page(){return <CheckoutView liveCatalog={await readStorefrontCatalog()} />;}
