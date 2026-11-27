import type { Metadata } from "next";
import { CartView } from "@/components/sites/nari/cart-view";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  robots: { index: false, follow: false },
};

export default async function Page() { return <CartView liveCatalog={await readStorefrontCatalog()} />; }
