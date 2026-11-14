import type { Metadata } from "next";
import { SupportView } from "@/components/sites/hasaki/support-view";

export const metadata: Metadata = {
  title: "Trung Tâm Hỗ Trợ Khách Hàng | Nari Home",
  description: "Giải đáp thắc mắc, hướng dẫn đặt hàng, chính sách giao nhanh NariNow 2H, phương thức thanh toán và bảo hành tại Nari Home. Hotline miễn phí 1800 6324."
};

export default function SupportPage() {
  return <SupportView />;
}
