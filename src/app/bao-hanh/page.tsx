import type { Metadata } from "next";
import { WarrantyView } from "@/components/sites/hasaki/warranty-view";

export const metadata: Metadata = {
  title: "Tra Cứu Bảo Hành Điện Tử & Chính Sách Hậu Mãi | Hasaki.vn",
  description: "Tra cứu thông tin bảo hành thiết bị làm đẹp, phụ kiện công nghệ, đồ gia dụng chính hãng theo số điện thoại hoặc mã Serial. Tiếp nhận tại 350+ cửa hàng Hasaki."
};

export default function WarrantyPage() {
  return <WarrantyView />;
}
