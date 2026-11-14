import type { Metadata } from "next";
import { StoreLocatorView } from "@/components/sites/hasaki/store-locator-view";

export const metadata: Metadata = {
  title: "Hệ Thống Cửa Hàng & Hasaki Clinic Toàn Quốc | Hasaki.vn",
  description: "Tìm kiếm hơn 350 cửa hàng mỹ phẩm chính hãng và phòng khám da liễu Hasaki Clinic & Spa trên toàn quốc. Mở cửa 08:00 - 22:00 mỗi ngày."
};

export default function StoreLocatorPage() {
  return <StoreLocatorView />;
}
