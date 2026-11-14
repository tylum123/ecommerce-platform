"use client";

import Link from "next/link";
import { 
  CreditCard, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Smartphone, 
  Headphones, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Sparkles
} from "lucide-react";
import { getFooterData } from "@/lib/support-stores";

export function Footer() {
  const footerData = getFooterData();

  const iconMap: Record<string, React.ReactNode> = {
    CreditCard: <CreditCard className="w-8 h-8 text-emerald-700" />,
    Truck: <Truck className="w-8 h-8 text-emerald-700" />,
    RotateCcw: <RotateCcw className="w-8 h-8 text-emerald-700" />,
    ShieldCheck: <ShieldCheck className="w-8 h-8 text-emerald-700" />
  };

  return (
    <footer className="footer-unified">
      {/* 4 Core Value Propositions */}
      <div className="footer-benefits wrap">
        {footerData.benefits.map((benefit) => (
          <div key={benefit.title} className="benefit-item">
            <div className="benefit-icon">
              {iconMap[benefit.icon] || <ShieldCheck className="w-8 h-8 text-emerald-700" />}
            </div>
            <div className="benefit-text">
              <b>{benefit.title}</b>
              <p className="text-xs text-muted-foreground hidden sm:block">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Footer Multi-column Grid */}
      <div className="wrap footer-grid">
        {/* Column 1: Customer Support */}
        <div>
          <b>HỖ TRỢ KHÁCH HÀNG</b>
          <p className="hotline-highlight">
            <Phone className="inline-block w-4 h-4 mr-1 text-emerald-600" />
            Hotline: <a href="tel:18006324" className="font-bold text-emerald-700 hover:underline">1800 6324</a>
            <span className="text-xs text-muted-foreground block">(Miễn phí, 08:00 - 22:00 mỗi ngày)</span>
          </p>
          <p><Link href="/he-thong-cua-hang" className="hover:text-emerald-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Hệ thống 350+ cửa hàng</Link></p>
          <p><Link href="/bao-hanh" className="hover:text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Trung tâm bảo hành</Link></p>
          <p><Link href="/ho-tro" className="hover:text-emerald-700 flex items-center gap-1"><Headphones className="w-3.5 h-3.5" /> Các câu hỏi thường gặp</Link></p>
          <p><Link href="/ho-tro/huong-dan-dat-hang" className="hover:text-emerald-700">Hướng dẫn đặt hàng</Link></p>
          <p><Link href="/ho-tro/giao-nhanh-2h" className="hover:text-emerald-700">Giao nhanh miễn phí 2H</Link></p>
          <p><Link href="/ho-tro/phuong-thuc-thanh-toan" className="hover:text-emerald-700">Phương thức thanh toán</Link></p>
          <p><Link href="/ho-tro/chinh-sach-doi-tra" className="hover:text-emerald-700">Chính sách đổi trả 30 ngày</Link></p>
        </div>

        {/* Column 2: About Hasaki */}
        <div>
          <b>VỀ HASAKI.VN</b>
          <p><Link href="/ho-tro/gioi-thieu" className="hover:text-emerald-700">Giới thiệu Hasaki.vn</Link></p>
          <p><Link href="/ho-tro/chinh-sach-bao-mat" className="hover:text-emerald-700">Chính sách bảo mật</Link></p>
          <p><Link href="/ho-tro/dieu-khoan-su-dung" className="hover:text-emerald-700">Điều khoản sử dụng</Link></p>
          <p><Link href="/ho-tro/lien-he" className="hover:text-emerald-700">Thông tin liên hệ</Link></p>
          <p><Link href="/ho-tro/ma-xac-thuc-otp" className="hover:text-emerald-700">Mã xác thực OTP</Link></p>
          <p><Link href="/ho-tro/tai-khoan" className="hover:text-emerald-700">Tài khoản thành viên</Link></p>
        </div>

        {/* Column 3: Services & Booking */}
        <div>
          <b>HỢP TÁC &amp; DỊCH VỤ</b>
          <p><Link href="/clinic" className="hover:text-emerald-700 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Hasaki Clinic &amp; Spa</Link></p>
          <p><Link href="/booking" className="hover:text-emerald-700 font-medium text-emerald-700">Đặt hẹn Clinic &amp; Spa</Link></p>
          <p><Link href="/danh-muc/dermahair-c2298.html" className="hover:text-emerald-700">Dermahair chuyên sâu</Link></p>
          <p><Link href="/he-thong-cua-hang" className="hover:text-emerald-700">Chi nhánh có Hasaki Clinic</Link></p>
          <p><Link href="/bao-hanh" className="hover:text-emerald-700">Tra cứu bảo hành thiết bị</Link></p>
        </div>

        {/* Column 4: App & Connect */}
        <div>
          <b>CẬP NHẬT &amp; KẾT NỐI</b>
          <p className="text-xs text-muted-foreground mb-3">Tải ứng dụng Hasaki để nhận thêm voucher 10% cho đơn hàng đầu tiên.</p>
          <a 
            href="https://hotro.hasaki.vn/app" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="app-label inline-flex items-center gap-2 hover:bg-emerald-800 transition-colors"
          >
            <Smartphone className="w-4 h-4" /> TẢI ỨNG DỤNG HASAKI
          </a>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> Mua sắm: 08:00 - 22:00</p>
            <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> Clinic &amp; Spa: 09:00 - 20:00</p>
            <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email: hotro@hasaki.vn</p>
          </div>
        </div>
      </div>

      {/* Top Search Keywords Row */}
      <div className="wrap border-t border-gray-200 py-3 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-700">Top tìm kiếm:</span>
        {footerData.topKeywords.map((item, idx) => (
          <span key={item.name} className="flex items-center">
            <Link href={item.url} className="hover:text-emerald-700 hover:underline">
              {item.name}
            </Link>
            {idx < footerData.topKeywords.length - 1 && <span className="mx-1.5 text-gray-300">·</span>}
          </span>
        ))}
      </div>

      {/* Bottom Company Legal & Copyright Notice */}
      <div className="wrap footer-bottom">
        <b>HASAKI.VN - TIẾT KIỆM HƠN. MỌI LÚC.</b>
        <p className="company-meta text-xs text-muted-foreground mt-1">
          {footerData.companyInfo.name} · {footerData.companyInfo.license}
          <br />
          {footerData.companyInfo.address}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {footerData.companyInfo.copyright}
        </p>
      </div>
    </footer>
  );
}
