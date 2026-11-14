"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
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
  filterStoreBranches 
} from "@/lib/support-stores";

export function StoreLocatorView() {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả Tỉnh/Thành");
  const [selectedDistrict, setSelectedDistrict] = useState("Tất cả Quận/Huyện");
  const [hasClinicOnly, setHasClinicOnly] = useState(false);

  const cities = useMemo(() => getStoreCities(), []);
  const districts = useMemo(() => getStoreDistricts(selectedCity), [selectedCity]);

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
    });
  }, [selectedCity, selectedDistrict, hasClinicOnly, query]);

  const totalAll = getStoreBranches().length;
  const clinicTotal = getStoreBranches().filter(b => b.hasClinic).length;

  return (
    <div className="store-locator-page min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumb strip */}
      <div className="bg-white border-b border-gray-200">
        <div className="wrap py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-700">Trang chủ</Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-800 font-medium">Hệ thống cửa hàng Hasaki</span>
        </div>
      </div>

      <main className="wrap py-6 flex-1">
        {/* Banner header */}
        <section className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Store className="w-3.5 h-3.5" />
              <span>HỆ THỐNG PHỦ SÓNG TOÀN QUỐC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Tìm Cửa Hàng &amp; Phòng Khám Hasaki Gần Bạn
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Mạng lưới hơn 350 cửa hàng mỹ phẩm chính hãng và hệ thống phòng khám da liễu Hasaki Clinic &amp; Spa. Mở cửa từ 08:00 - 22:00 tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật).
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
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 disabled:text-gray-400"
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
                    ? "bg-emerald-700 text-white" 
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
                    ? "bg-emerald-700 text-white" 
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Có Hasaki Clinic &amp; Spa ({clinicTotal})
              </button>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Tìm thấy <b className="text-emerald-700 font-bold">{filteredBranches.length}</b> cửa hàng phù hợp
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
                  <Image
                    src={branch.image || "https://hasaki.vn/images/graphics/cuahang-4.jpg"}
                    alt={branch.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  {branch.hasClinic && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Hasaki Clinic &amp; Spa
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
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Giờ mở cửa: {branch.hours || "08:00 - 22:00 mỗi ngày"}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Hotline miễn phí: <a href="tel:18006324" className="text-emerald-700 font-semibold hover:underline">1800 6324</a></span>
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
                        className="flex-1 text-center py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
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
