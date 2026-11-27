"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { 
  Headphones, 
  Search, 
  ChevronRight, 
  HelpCircle, 
  Phone, 
  Clock, 
  Truck, 
  CreditCard, 
  KeyRound, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  ChevronDown,
  Building,
  Store,
  Sparkles
} from "lucide-react";
import type { SupportTopic } from "@/lib/backend-contracts";
import { 
  getSupportTopics, 
  getSupportCategories, 
  searchSupportTopics 
} from "@/lib/support-stores";

export function SupportView() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Tất cả");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const allTopics = useMemo(() => getSupportTopics(), []);
  const categories = useMemo(() => ["Tất cả", ...getSupportCategories()], []);

  const searchResults = useMemo(() => {
    let list = query.trim() ? searchSupportTopics(query) : allTopics;
    if (activeCategory !== "Tất cả") {
      list = list.filter(item => item.category === activeCategory);
    }
    return list;
  }, [query, activeCategory, allTopics]);

  const categoryIcons: Record<string, React.ReactNode> = {
    "Mua hàng & Giao nhanh 2H": <Truck className="w-5 h-5 text-[#3d2e24]" />,
    "Thanh toán & Đổi trả": <CreditCard className="w-5 h-5 text-[#3d2e24]" />,
    "Tài khoản & OTP": <KeyRound className="w-5 h-5 text-[#3d2e24]" />,
    "Chính sách & Bảo mật": <ShieldCheck className="w-5 h-5 text-[#3d2e24]" />,
    "Giới thiệu & Liên hệ": <Building className="w-5 h-5 text-[#3d2e24]" />
  };

  const commonFaqs = [
    {
      q: "Nari Home có cam kết hàng chính hãng không? Nếu phát hiện hàng giả thì sao?",
      a: "Nari Home cam kết 100% sản phẩm chính hãng, đầy đủ tem phụ tiếng Việt và hóa đơn VAT. Nari Home cùng nhãn hàng áp dụng chính sách bảo vệ 2 lớp đền bù lên tới 200% nếu phát hiện hàng giả (100% từ Nari Home và 100% từ nhà phân phối hoặc văn phòng đại diện chính hãng tại Việt Nam)."
    },
    {
      q: "Điều kiện áp dụng dịch vụ Giao Nhanh NariNow 2H là gì?",
      a: "NariNow 2H áp dụng cho đơn hàng từ 90.000đ tại TP. Hồ Chí Minh, Cần Thơ và các khu vực nội thành có chi nhánh Nari Home. Đơn hàng được đặt trong khung giờ từ 08:00 - 18:00 sẽ được giao trong vòng 2 giờ."
    },
    {
      q: "Chính sách đổi trả sản phẩm trong 30 ngày được áp dụng như thế nào?",
      a: "Khách hàng được đổi trả miễn phí trong vòng 30 ngày nếu sản phẩm có lỗi kỹ thuật từ nhà sản xuất hoặc kích ứng (có xác nhận y tế). Sản phẩm cần còn nguyên tem, bao bì và hóa đơn mua hàng tại Nari Home."
    },
    {
      q: "Mã OTP dùng để làm gì và nếu không nhận được OTP thì xử lý thế nào?",
      a: "Mã OTP (One Time Password) gồm 6 chữ số dùng để xác minh đăng ký tài khoản, khôi phục mật khẩu hoặc xác nhận đơn hàng. Hệ thống ưu tiên gửi OTP qua Zalo, sau đó là tin nhắn SMS. Nếu sau 60 giây không nhận được mã, vui lòng nhấn Gửi lại hoặc liên hệ tổng đài 1800 6324."
    }
  ];

  return (
    <div className="support-center-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="wrap py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#3d2e24]">Trang chủ</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-800 font-medium">Trung tâm hỗ trợ khách hàng</span>
        </div>
      </div>

      <main className="wrap py-6 flex-1">
        {/* Support Hero Header & Search */}
        <section className="bg-gradient-to-r from-[#3d2e24] to-teal-950 text-white rounded-xl p-8 mb-8 shadow-sm text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-[#3d2e24]/60 text-[#f6ece3] text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Headphones className="w-3.5 h-3.5" />
              NARI HOME CUSTOMER CARE · HOTLINE 1800 6324
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">
              Xin chào! Chúng tôi có thể giúp gì cho bạn?
            </h1>
            <p className="text-[#f6ece3] text-xs sm:text-sm mb-6">
              Tra cứu chính sách giao hàng, đổi trả, bảo hành thiết bị và hướng dẫn mua sắm tại Nari Home
            </p>

            {/* Big Search Input */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập câu hỏi hoặc từ khóa cần tìm (vd: đổi trả, giao nhanh 2h, otp, bảo hành)..."
                className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
            </div>
          </div>
        </section>

        {/* Quick Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#faf5f0] text-[#3d2e24] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng đài CSKH (Miễn phí)</p>
              <a href="tel:18006324" className="text-base font-bold text-[#3d2e24] hover:underline">
                1800 6324
              </a>
              <span className="text-[11px] text-gray-400 block">Hỗ trợ mua hàng &amp; CSKH</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#faf5f0] text-[#3d2e24] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Thời gian phục vụ</p>
              <p className="text-sm font-bold text-gray-800">08:00 – 22:00</p>
              <span className="text-[11px] text-gray-400 block">Tất cả các ngày trong tuần</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#faf5f0] text-[#3d2e24] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Hệ thống chi nhánh</p>
              <Link href="/he-thong-cua-hang" className="text-sm font-bold text-[#3d2e24] hover:underline flex items-center gap-1">
                350+ Cửa hàng toàn quốc <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] text-gray-400 block">Xem chi nhánh gần bạn nhất</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#3d2e24] text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Help Topics Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#3d2e24]" />
            Chủ Đề Hướng Dẫn &amp; Chính Sách
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((topic) => (
              <Link
                key={topic.slug}
                href={`/ho-tro/${topic.slug}`}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-[#9e7656] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#3d2e24] mb-2">
                    {categoryIcons[topic.category] || <HelpCircle className="w-4 h-4 text-[#3d2e24]" />}
                    <span>{topic.category}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2 group-hover:text-[#3d2e24] transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {topic.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#3d2e24] group-hover:text-[#2a1f18]">
                  <span>Xem chi tiết hướng dẫn</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          {searchResults.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <HelpCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">Không tìm thấy bài viết nào phù hợp với từ khóa</p>
              <p className="text-xs text-gray-500 mt-1">Quý khách vui lòng thử tìm kiếm bằng từ khóa khác hoặc liên hệ hotline 1800 6324.</p>
            </div>
          )}
        </section>

        {/* Frequently Asked Questions Accordion */}
        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3d2e24]" />
            Các Câu Hỏi Thường Gặp (FAQ)
          </h2>

          <div className="space-y-3">
            {commonFaqs.map((faq, idx) => (
              <div 
                key={faq.q} 
                className="border border-gray-200 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full text-left p-4 bg-gray-50/70 hover:bg-gray-100/70 flex items-center justify-between gap-4 font-semibold text-sm text-gray-800"
                  aria-expanded={openFaqIndex === idx}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${openFaqIndex === idx ? "rotate-180 text-[#3d2e24]" : ""}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 text-xs sm:text-sm text-gray-600 bg-white leading-relaxed border-t border-gray-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function SupportArticleView({ topic }: { topic: SupportTopic }) {
  const allTopics = getSupportTopics();
  const relatedTopics = allTopics.filter(t => t.category === topic.category && t.slug !== topic.slug).slice(0, 3);

  return (
    <div className="support-article-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="wrap py-2.5 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#3d2e24]">Trang chủ</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link href="/ho-tro" className="hover:text-[#3d2e24]">Hỗ trợ khách hàng</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500">{topic.category}</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-800 font-medium line-clamp-1">{topic.title}</span>
        </div>
      </div>

      <main className="wrap py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article Content */}
          <article className="lg:col-span-3 bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d2e24] bg-[#faf5f0] px-3 py-1 rounded-full mb-3">
              <span>{topic.category}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {topic.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-700 font-medium bg-slate-50 p-4 rounded-lg border-l-4 border-[#9e7656] mb-8 leading-relaxed">
              {topic.summary}
            </p>

            {/* Sections */}
            <div className="space-y-6">
              {topic.sections.map((section, idx) => (
                <section key={idx} className="border-b border-gray-100 pb-6 last:border-none">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 text-[#2a1f18]">
                    {section.heading}
                  </h2>
                  <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                    {section.body.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Source Reference & Hotline Box */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
              <div>
                <span>Nguồn tham chiếu Nari Home: </span>
                <a 
                  href={topic.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#3d2e24] font-medium hover:underline inline-flex items-center gap-1"
                >
                  {topic.sourceUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                Hotline hỗ trợ: <a href="tel:18006324" className="font-bold text-[#3d2e24]">1800 6324</a> (Miễn phí)
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Contact Widget */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#3d2e24]" />
                Cần Hỗ Trợ Trực Tiếp?
              </h3>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Đội ngũ chăm sóc khách hàng Nari Home sẵn sàng giải đáp mọi thắc mắc từ 08:00 - 22:00 mỗi ngày.
              </p>
              <a
                href="tel:18006324"
                className="w-full text-center py-2.5 px-3 bg-[#3d2e24] hover:bg-[#2a1f18] text-white rounded-lg text-xs font-bold block transition-colors"
              >
                GỌI 1800 6324 (MIỄN PHÍ)
              </a>
            </div>

            {/* Related Topics Widget */}
            {relatedTopics.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3d2e24]" />
                  Bài Viết Liên Quan
                </h3>
                <ul className="space-y-3">
                  {relatedTopics.map((rel) => (
                    <li key={rel.slug} className="text-xs">
                      <Link 
                        href={`/ho-tro/${rel.slug}`} 
                        className="font-medium text-gray-800 hover:text-[#3d2e24] line-clamp-2 hover:underline"
                      >
                        {rel.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shortcut back to help center */}
            <Link
              href="/ho-tro"
              className="text-xs font-semibold text-[#3d2e24] hover:text-[#2a1f18] flex items-center gap-1.5 p-3 rounded-lg border border-dashed border-[#d4beaa] bg-[#faf5f0]/80 justify-center transition-colors"
            >
              <span>← Về trung tâm hỗ trợ Nari Home</span>
            </Link>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
