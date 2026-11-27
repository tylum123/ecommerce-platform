import type { Metadata } from "next";
import { StoreLocatorView } from "@/components/sites/nari/store-locator-view";
import { readPostgresBranchesSafely } from "@/lib/server/postgres-branch-service";
import { getPostgresDatabase } from "@/lib/server/postgres-database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hệ Thống Cửa Hàng Toàn Quốc | Nari Home",
  description: "Tìm kiếm hệ thống cửa hàng mỹ phẩm chính hãng Nari Home trên toàn quốc. Mở cửa 08:00 - 22:00 mỗi ngày."
};

export default async function StoreLocatorPage() {
  const branches = await readPostgresBranchesSafely(() => getPostgresDatabase());
  return <StoreLocatorView branches={branches} />;
}
