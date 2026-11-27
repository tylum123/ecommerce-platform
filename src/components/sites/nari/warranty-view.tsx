"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { 
  ShieldCheck, 
  Search, 
  ChevronRight, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  FileCheck,
  Send,
  Building2
} from "lucide-react";
import { 
  getWarrantyPolicyData, 
  lookupWarrantyDraft, 
  type WarrantyLookupResult 
} from "@/lib/support-stores";

export function WarrantyView() {
  const [activeTab, setActiveTab] = useState<"lookup" | "request" | "policy">("lookup");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<WarrantyLookupResult | null>(null);
  const [searched, setSearched] = useState(false);

  // Warranty request form state
  const [reqPhone, setReqPhone] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqProduct, setReqProduct] = useState("");
  const [reqSerial, setReqSerial] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState("");

  const policyData = getWarrantyPolicyData();

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    const res = lookupWarrantyDraft(lookupQuery);
    setLookupResult(res);
    setSearched(true);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0\d{9}$/.test(reqPhone.trim())) {
      setReqError("Vui lòng nhập số điện thoại hợp lệ gồm 10 chữ số bắt đầu bằng 0.");
      return;
    }
    if (!reqName.trim() || !reqProduct.trim()) {
      setReqError("Vui lòng nhập họ và tên cùng tên sản phẩm cần bảo hành.");
      return;
    }
    setReqError("");
    setReqSuccess(true);
  };

  return (
    <div className="warranty-center-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="wrap py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#3d2e24]">Trang chủ</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-800 font-medium">Trung tâm bảo hành Nari Home</span>
        </div>
      </div>

      <main className="wrap py-6 flex-1">
        {/* Banner Hero */}
        <section className="bg-gradient-to-r from-[#3d2e24] to-[#1e1b18] text-white rounded-xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#3d2e24]/60 text-[#f6ece3] text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG 100%</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Trung Tâm Bảo Hành &amp; Dịch Vụ Hậu Mãi Nari Home
            </h1>
            <p className="text-[#f6ece3] text-sm leading-relaxed mb-4">
              Tra cứu thời hạn bảo hành điện tử theo Số điện thoại hoặc Serial máy, gửi yêu cầu bảo hành nhanh và xem chính sách bảo hành chính hãng từ các nhãn hàng thiết bị làm đẹp, phụ kiện công nghệ và gia dụng.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#efe2d4]">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Hotline: 1800 6324 (Miễn phí)</span>
              <span>·</span>
              <a 
                href="https://narihome.io.vn/bao-hanh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline flex items-center gap-1 text-[#f6ece3]"
              >
                Cổng bảo hành chính thức <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("lookup")}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "lookup"
                ? "border-[#6e5a4f] text-[#3d2e24]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Search className="w-4 h-4" />
            Tra cứu bảo hành
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("request")}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "request"
                ? "border-[#6e5a4f] text-[#3d2e24]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Send className="w-4 h-4" />
            Yêu cầu bảo hành
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("policy")}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "policy"
                ? "border-[#6e5a4f] text-[#3d2e24]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Chính sách &amp; Quy định
          </button>
        </div>

        {/* Tab 1: Tra cứu bảo hành */}
        {activeTab === "lookup" && (
          <div className="bg-white rounded-b-xl p-6 border-x border-b border-gray-200 shadow-sm mb-8">
            <div className="max-w-2xl mx-auto py-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">
                Tra Cứu Thông Tin Bảo Hành Điện Tử
              </h2>
              <p className="text-xs text-gray-500 mb-6 text-center">
                Nhập số điện thoại đặt hàng hoặc mã Serial / mã đơn hàng trên hóa đơn Nari Home
              </p>

              <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="Nhập số điện thoại (vd: 0901234567) hoặc Serial (vd: ANK-ZOLO-2026-9812)..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3d2e24] hover:bg-[#2a1f18] text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
                >
                  Tra cứu ngay
                </button>
              </form>

              {/* Sample suggestions for testing */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-6 justify-center">
                <span>Dữ liệu mẫu thử nghiệm:</span>
                <button
                  type="button"
                  onClick={() => { setLookupQuery("0901234567"); }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-mono"
                >
                  0901234567 (Anker)
                </button>
                <button
                  type="button"
                  onClick={() => { setLookupQuery("0912345678"); }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-mono"
                >
                  0912345678 (Halio)
                </button>
                <button
                  type="button"
                  onClick={() => { setLookupQuery("ANK-ZOLO-2026-9812"); }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-mono"
                >
                  ANK-ZOLO-2026-9812
                </button>
              </div>

              {/* Lookup Result Box */}
              {searched && lookupResult && (
                <div className={`p-5 rounded-xl border ${
                  lookupResult.found 
                    ? "bg-[#faf5f0]/60 border-[#e6d5c5]" 
                    : "bg-amber-50/60 border-amber-200"
                }`}>
                  <div className="flex items-start gap-3">
                    {lookupResult.found ? (
                      <CheckCircle2 className="w-6 h-6 text-[#3d2e24] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`text-sm font-bold mb-1 ${
                        lookupResult.found ? "text-[#1e1b18]" : "text-amber-900"
                      }`}>
                        {lookupResult.found ? "Tìm Thấy Thông Tin Bảo Hành" : "Không Tìm Thấy Thông Tin"}
                      </h3>
                      <p className="text-xs text-gray-700 mb-3">{lookupResult.message}</p>

                      {lookupResult.found && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3.5 rounded-lg border border-[#e6d5c5] shadow-2xs">
                          <div>
                            <span className="text-gray-500 block">Khách hàng:</span>
                            <span className="font-semibold text-gray-800">{lookupResult.customerName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Số điện thoại:</span>
                            <span className="font-semibold text-gray-800">{lookupResult.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Sản phẩm:</span>
                            <span className="font-semibold text-gray-800">{lookupResult.productName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Mã Serial:</span>
                            <span className="font-mono font-semibold text-gray-800">{lookupResult.serialNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Ngày mua:</span>
                            <span className="font-semibold text-gray-800">{lookupResult.purchaseDate}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Hạn bảo hành:</span>
                            <span className="font-semibold text-[#3d2e24]">{lookupResult.warrantyExpireDate}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500 block">Nơi mua / Tiếp nhận:</span>
                            <span className="font-semibold text-gray-800">{lookupResult.branchName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Yêu cầu bảo hành */}
        {activeTab === "request" && (
          <div className="bg-white rounded-b-xl p-6 border-x border-b border-gray-200 shadow-sm mb-8">
            <div className="max-w-xl mx-auto py-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">
                Gửi Yêu Cầu Bảo Hành Sản Phẩm
              </h2>
              <p className="text-xs text-gray-500 mb-6 text-center">
                Điền thông tin thiết bị cần bảo hành hoặc đổi mới. Nhân viên kỹ thuật Nari Home sẽ liên hệ xác nhận sau ít phút.
              </p>

              {reqSuccess ? (
                <div className="bg-[#faf5f0] border border-[#e6d5c5] rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-[#3d2e24] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#1e1b18] mb-1">
                    Gửi Yêu Cầu Bảo Hành Thành Công!
                  </h3>
                  <p className="text-xs text-gray-700 mb-4 leading-relaxed">
                    Hệ thống đã ghi nhận yêu cầu bảo hành cho số điện thoại <b>{reqPhone}</b>. Chuyên viên chăm sóc khách hàng Nari Home sẽ liên hệ lại với bạn qua số điện thoại để hướng dẫn gửi máy hoặc tiếp nhận trực tiếp tại chi nhánh.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReqSuccess(false);
                      setReqPhone("");
                      setReqName("");
                      setReqProduct("");
                      setReqSerial("");
                      setReqNote("");
                    }}
                    className="px-4 py-2 bg-[#3d2e24] text-white rounded-lg text-xs font-semibold hover:bg-[#2a1f18] transition-colors"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
                  {reqError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                      {reqError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="req-phone" className="block text-xs font-semibold text-gray-700 mb-1">
                      Số điện thoại mua hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="req-phone"
                      type="tel"
                      value={reqPhone}
                      onChange={(e) => setReqPhone(e.target.value)}
                      placeholder="Số điện thoại gồm 10 chữ số..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-name" className="block text-xs font-semibold text-gray-700 mb-1">
                      Họ và tên khách hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="req-name"
                      type="text"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Họ và tên..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-prod" className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên sản phẩm / Thiết bị cần bảo hành <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="req-prod"
                      type="text"
                      value={reqProduct}
                      onChange={(e) => setReqProduct(e.target.value)}
                      placeholder="Ví dụ: Máy rửa mặt Halio, Củ sạc Anker 30W..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-serial" className="block text-xs font-semibold text-gray-700 mb-1">
                      Số Serial hoặc Mã đơn hàng (nếu có)
                    </label>
                    <input
                      id="req-serial"
                      type="text"
                      value={reqSerial}
                      onChange={(e) => setReqSerial(e.target.value)}
                      placeholder="Nhập mã Serial trên thân máy hoặc hộp..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-note" className="block text-xs font-semibold text-gray-700 mb-1">
                      Mô tả tình trạng lỗi của thiết bị
                    </label>
                    <textarea
                      id="req-note"
                      rows={3}
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      placeholder="Mô tả chi tiết hiện tượng lỗi (vd: không lên nguồn, sạc không vào điện...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500 italic">
                    * Lưu ý: Giao diện thử nghiệm Next.js. Thông tin không gửi ra ngoài hệ thống và không lưu trữ nhạy cảm.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#3d2e24] hover:bg-[#2a1f18] text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
                  >
                    Gửi yêu cầu tiếp nhận bảo hành
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Chính sách bảo hành */}
        {activeTab === "policy" && (
          <div className="bg-white rounded-b-xl p-6 sm:p-8 border-x border-b border-gray-200 shadow-sm mb-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Introduction */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {policyData.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {policyData.policySummary}
                </p>
              </div>

              {/* General Terms */}
              <div className="bg-slate-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3d2e24]" />
                  Quy Định Chung Về Bảo Hành
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  {policyData.generalTerms.map((term, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#3d2e24] font-bold">•</span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Categories Breakdown */}
              <div className="space-y-6">
                <h3 className="font-bold text-base text-gray-900">
                  Thời Gian &amp; Điều Kiện Áp Dụng Từng Nhóm Thiết Bị
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {policyData.categories.map((cat, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="inline-block bg-[#faf5f0] text-[#2a1f18] font-bold text-xs px-2.5 py-1 rounded-md mb-2">
                          {cat.period}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 mb-2">
                          {cat.title}
                        </h4>
                        <div className="text-xs text-gray-500 mb-3">
                          <b>Thương hiệu:</b> {cat.brands.join(", ")}
                        </div>

                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                          <b className="text-gray-800 block">Phạm vi bảo hành:</b>
                          {cat.coverage.map((c, cIdx) => (
                            <p key={cIdx}>- {c}</p>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                        <b className="text-gray-700 block mb-0.5">Điều kiện hợp lệ:</b>
                        {cat.conditions.map((cd, cdIdx) => (
                          <p key={cdIdx}>• {cd}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process Steps */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-bold text-base text-gray-900 mb-4">
                  Quy Trình 3 Bước Tiếp Nhận &amp; Xử Lý Bảo Hành
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {policyData.processSteps.map((step) => (
                    <div key={step.step} className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                      <div className="w-7 h-7 rounded-full bg-[#3d2e24] text-white font-bold text-xs flex items-center justify-center mb-2">
                        {step.step}
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 mb-1">{step.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Store network locator shortcut */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#3d2e24]" />
              Tiếp Nhận Bảo Hành Tại Toàn Bộ Hệ Thống Cửa Hàng
            </h3>
            <p className="text-xs text-gray-600">
              Quý khách có thể mang trực tiếp thiết bị tới bất kỳ cửa hàng nào trong hơn 350 chi nhánh Nari Home để được nhân viên hỗ trợ tiếp nhận.
            </p>
          </div>
          <Link
            href="/he-thong-cua-hang"
            className="px-5 py-2.5 bg-[#3d2e24] hover:bg-[#2a1f18] text-white font-bold text-xs rounded-lg transition-colors shrink-0"
          >
            Tìm cửa hàng gần nhất
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
