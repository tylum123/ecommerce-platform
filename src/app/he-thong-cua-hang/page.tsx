import type { Metadata } from "next";
import { StoreLocatorView } from "@/components/sites/nari/store-locator-view";
import { readPostgresBranchesSafely } from "@/lib/server/postgres-clinic-service";
import { getPostgresDatabase } from "@/lib/server/postgres-database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hệ Thống Cửa Hàng & Nari Clinic & Spa Toàn Quốc | Nari Home",
  description: "Tìm kiếm hơn 350 cửa hàng mỹ phẩm chính hãng và phòng khám da liễu Nari Clinic & Spa trên toàn quốc. Mở cửa 08:00 - 22:00 mỗi ngày."
};

export default async function StoreLocatorPage() {
  const branches = await readPostgresBranchesSafely(() => getPostgresDatabase());
  return <StoreLocatorView branches={branches} />;
}
