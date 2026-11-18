"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  Search, 
  ExternalLink, 
  Calendar, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { 
  getStoreBranches, 
  getStoreCities, 
  getStoreDistricts, 
  filterStoreBranches,
  type StoreBranchInfo,
} from "@/lib/support-stores";

export function StoreLocatorView({ branches = [] }: { branches?: StoreBranchInfo[] }) {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả Tỉnh/Thành");
  const [selectedDistrict, setSelectedDistrict] = useState("Tất cả Quận/Huyện");
  const [hasClinicOnly, setHasClinicOnly] = useState(false);

  const cities = useMemo(() => getStoreCities(branches), [branches]);
  const districts = useMemo(() => getStoreDistricts(selectedCity, branches), [selectedCity, branches]);

  // When city changes, reset district
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict("Tất cả Quận/Huyện");
  };

  const filteredBranches = useMemo(() => {
    return filterStoreBranches({
      city: selectedCity,
      district: selectedDistrict,
      hasClinic: hasClinicOnly,
      query: query
    }, branches);
  }, [selectedCity, selectedDistrict, hasClinicOnly, query, branches]);

  const allBranches = useMemo(() => getStoreBranches(branches), [branches]);
  const totalAll = allBranches.length;
  const clinicTotal = allBranches.filter(b => b.hasClinic).length;

  return (
    <div className="store-locator-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb strip */}
      <div className="bg-white border-b border-gray-200">
        <div className="wrap py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#3d2e24]">Trang chủ</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-800 font-medium">Hệ thống cửa hàng Nari Home</span>
        </div>
      </div>

      <main className="wrap py-6 flex-1">
        {/* Banner header */}
        <section className="bg-gradient-to-r from-[#3d2e24] to-[#1e1b18] text-white rounded-xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#3d2e24]/60 text-[#f6ece3] text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Store className="w-3.5 h-3.5" />
              <span>HỆ THỐNG PHỦ SÓNG TOÀN QUỐC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Tìm Cửa Hàng &amp; Phòng Khám Nari Home Gần Bạn
            </h1>
            <p className="text-[#f6ece3] text-sm sm:text-base leading-relaxed">
              Mạng lưới hơn 350 cửa hàng mỹ phẩm chính hãng và hệ thống phòng khám da liễu Nari Clinic & Spa &amp; Spa. Mở cửa từ 08:00 - 22:00 tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật).
            </p>
          </div>
        </section>

        {/* Filter controls toolbar */}
        <section className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search text input */}
            <div className="md:col-span-2 relative">
              <label htmlFor="store-search" className="block text-xs font-semibold text-gray-700 mb-1">
                Tìm kiếm theo tên đường, quận, phường
              </label>
              <div className="relative">
                <input
                  id="store-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập tên đường, địa chỉ hoặc tên chi nhánh..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9e7656] focus:border-transparent"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* City select */}
            <div>
              <label htmlFor="city-select" className="block text-xs font-semibold text-gray-700 mb-1">
                Tỉnh / Thành phố
              </label>
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9e7656]"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* District select */}
            <div>
              <label htmlFor="district-select" className="block text-xs font-semibold text-gray-700 mb-1">
                Quận / Huyện
              </label>
              <select
                id="district-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={districts.length <= 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9e7656] disabled:bg-gray-100 disabled:text-gray-400"
              >
                {districts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle pill buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setHasClinicOnly(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !hasClinicOnly 
                    ? "bg-[#3d2e24] text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tất cả cửa hàng ({totalAll})
              </button>
              <button
                type="button"
                onClick={() => setHasClinicOnly(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  hasClinicOnly 
                    ? "bg-[#3d2e24] text-white" 
                    : "bg-[#faf5f0] text-[#2a1f18] border border-[#e6d5c5] hover:bg-[#f6ece3]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Có Nari Clinic & Spa &amp; Spa ({clinicTotal})
              </button>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Tìm thấy <b className="text-[#3d2e24] font-bold">{filteredBranches.length}</b> cửa hàng phù hợp
            </div>
          </div>
        </section>

        {/* Store Branches Grid */}
        {filteredBranches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBranches.map((branch) => (
              <article 
                key={branch.id} 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Branch image banner */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  {branch.image ? (
                    <Image
                      src={branch.image}
                      alt={branch.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#f6ece3] to-[#e6d5c5] flex items-center justify-center p-4 text-center">
                      <span className="text-sm font-semibold text-[#3d2e24] line-clamp-2">{branch.name}</span>
                    </div>
                  )}
                  {branch.hasClinic && (
                    <span className="absolute top-2.5 right-2.5 bg-[#3d2e24] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Nari Clinic & Spa &amp; Spa
                    </span>
                  )}
                </div>

                {/* Branch details body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 text-base mb-2 line-clamp-2">
                      {branch.name}
                    </h2>

                    <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-[#3d2e24] shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#3d2e24] shrink-0" />
                        <span>Giờ mở cửa: {branch.hours || "08:00 - 22:00 mỗi ngày"}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#3d2e24] shrink-0" />
                        <span>Hotline miễn phí: <a href="tel:18006324" className="text-[#3d2e24] font-semibold hover:underline">1800 6324</a></span>
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <a
                      href={branch.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Xem bản đồ
                    </a>

                    {branch.hasClinic && (
                      <Link
                        href="/booking"
                        className="flex-1 text-center py-2 px-3 bg-[#3d2e24] hover:bg-[#2a1f18] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Đặt hẹn Clinic
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-gray-800 mb-1">
              Không tìm thấy chi nhánh nào phù hợp
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
              Vui lòng thử tìm kiếm với tên đường khác hoặc chọn lại Tỉnh/Thành phố và Quận/Huyện.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedCity("Tất cả Tỉnh/Thành");
                setSelectedDistrict("Tất cả Quận/Huyện");
                setHasClinicOnly(false);
              }}
              className="px-4 py-2 bg-[#3d2e24] text-white text-xs font-semibold rounded-lg hover:bg-[#2a1f18] transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
